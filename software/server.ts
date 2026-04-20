import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { spawn, ChildProcessWithoutNullStreams } from "child_process";
import fs from "fs";
import { fileURLToPath } from "url";
import { createServer } from "http";
import { Server } from "socket.io";
import * as pty from "node-pty";
import os from "os";
import { createProxyMiddleware } from "http-proxy-middleware";
import * as XLSX from 'xlsx';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
    },
  });

  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Denylist for harmful commands
  const DENYLIST = [
    "rm -rf /",
    "rm -rf /*",
    "shutdown",
    "reboot",
    ":(){ :|:& };:", // Fork bomb
    "mkfs",
    "dd if=/dev/zero",
  ];

  function isSafeCommand(cmd: string): boolean {
    const trimmed = cmd.trim().toLowerCase();
    return !DENYLIST.some(denied => trimmed.includes(denied));
  }

  io.on("connection", (socket) => {
    const shellConfigStr = socket.handshake.query.shellConfig as string;
    let shellConfig = { type: "local" };
    try {
      if (shellConfigStr) shellConfig = JSON.parse(shellConfigStr);
    } catch (e) { }

    console.log("Client connected to terminal, config:", shellConfig);

    let ptyProcess: any;

    try {
      if (shellConfig.type === "ssh") {
        const { user, host, port } = shellConfig as any;
        ptyProcess = pty.spawn("ssh", ["-tt", `${user}@${host}`, "-p", port || "22"], {
          name: "xterm-256color",
          cols: 80,
          rows: 24,
          cwd: process.cwd(),
          env: process.env as any,
        });
      } else {
        const shell = os.platform() === "win32" ? "powershell.exe" : "bash";
        ptyProcess = pty.spawn(shell, [], {
          name: "xterm-256color",
          cols: 80,
          rows: 24,
          cwd: process.cwd(),
          env: process.env as any,
        });
      }

      ptyProcess.onData((data: string) => {
        socket.emit("output", data);
      });

      socket.on("input", (data) => {
        if (ptyProcess) ptyProcess.write(data);
      });

      socket.on("resize", (size) => {
        if (ptyProcess) {
          ptyProcess.resize(size.cols, size.rows);
        }
      });

      ptyProcess.onExit(({ exitCode }: { exitCode: number }) => {
        socket.emit("output", `\r\nProcess exited with code ${exitCode}\r\n`);
        socket.disconnect();
      });
    } catch (ptyError: any) {
      console.error("PTY Spawn Error:", ptyError);
      socket.emit("output", `\r\nFailed to spawn terminal: ${ptyError.message}\r\n`);
    }

    socket.on("disconnect", () => {
      console.log("Client disconnected, killing pty");
      ptyProcess.kill();
    });
  });


  // API Route for listing files in assets directory
  app.get("/api/files/list", (req, res) => {
    const assetsDir = path.join(process.cwd(), "assets");
    try {
      if (!fs.existsSync(assetsDir)) {
        fs.mkdirSync(assetsDir, { recursive: true });
        return res.json({ files: [] });
      }
      const files = fs.readdirSync(assetsDir)
        .filter(file => !file.startsWith('.'))
        .map(file => ({
          name: file,
          type: path.extname(file).slice(1) || 'file'
        }));
      res.json({ files });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // API Route for reading files (needed for AI analysis)
  app.get("/api/files/read", (req, res) => {
    const filePathParam = req.query.path as string;
    console.log(`[GET] /api/files/read - Path: ${filePathParam}`);
    
    if (!filePathParam) return res.status(400).json({ error: "Path is required" });

    try {
      // Security: Prevent directory traversal and ensure we read from assets by default if no path prefix
      let relativePath = filePathParam;
      if (!relativePath.startsWith("assets" + path.sep) && !relativePath.startsWith("assets/")) {
        relativePath = path.join("assets", relativePath);
      }
      
      const filePath = path.join(process.cwd(), relativePath);
      if (!fs.existsSync(filePath)) {
        console.error(`File NOT found: ${filePath}`);
        return res.status(404).json({ error: `File not found at ${relativePath}` });
      }

      const fileExt = path.extname(filePath).toLowerCase();
      
      if (fileExt === '.xlsx' || fileExt === '.xls') {
        try {
          // Handle different import styles for XLSX
          const reader = (XLSX.readFile || (XLSX as any).default?.readFile);
          const sheetUtils = (XLSX.utils || (XLSX as any).default?.utils);
          
          if (!reader) throw new Error("XLSX reader not found. Please check library installation.");

          const workbook = reader(filePath);
          const sheetNames = workbook.SheetNames;
          const firstSheet = workbook.Sheets[sheetNames[0]];
          const data = sheetUtils.sheet_to_json(firstSheet, { range: 0, header: 1 }).slice(0, 10);
          
          console.log(`Parsed Excel file: ${sheetNames[0]} (${data.length} rows)`);
          res.json({ 
            content: JSON.stringify({ sheetNames, preview: data }), 
            isBinary: false, 
            isExcel: true 
          });
        } catch (excelErr: any) {
          console.error("Excel parse error:", excelErr);
          res.status(500).json({ error: `Could not parse Excel: ${excelErr.message}` });
        }
      } else if ([".png", ".jpg", ".jpeg", ".pdf", ".zip"].includes(fileExt)) {
        const content = fs.readFileSync(filePath, "base64");
        console.log(`Sending binary file as base64 (${fileExt})`);
        res.json({ content, isBinary: true });
      } else {
        const content = fs.readFileSync(filePath, "utf-8");
        console.log(`Sending text file (${fileExt})`);
        res.json({ content, isBinary: false });
      }
    } catch (err: any) {
      console.error(`Read error: ${err.message}`);
      res.status(500).json({ error: err.message });
    }
  });

  // API Route for persisting files (needed for terminal execution)
  app.post("/api/files/save", (req, res) => {
    const { fileName, content, isBase64 } = req.body;
    if (!fileName || content === undefined) {
      return res.status(400).json({ error: "Filename and content are required" });
    }

    try {
      let relativePath = fileName;
      if (!relativePath.startsWith("assets" + path.sep) && !relativePath.startsWith("assets/")) {
        relativePath = path.join("assets", relativePath);
      }
      
      const filePath = path.join(process.cwd(), relativePath);
      
      // Ensure directory exists
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const buffer = isBase64 ? Buffer.from(content, 'base64') : content;
      fs.writeFileSync(filePath, buffer);
      console.log(`Saved file to: ${filePath}`);
      res.json({ status: "success", path: relativePath });
    } catch (err: any) {
      console.error(`Save error: ${err.message}`);
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/files/delete", (req, res) => {
    const { fileName } = req.body;
    try {
      const filePath = path.join(process.cwd(), "assets", fileName);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/files/rename", (req, res) => {
    const { oldName, newName } = req.body;
    try {
      const oldPath = path.join(process.cwd(), "assets", oldName);
      const newPath = path.join(process.cwd(), "assets", newName);
      if (fs.existsSync(oldPath)) {
        fs.renameSync(oldPath, newPath);
      }
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // API Route for persisting files (needed for terminal execution)
  app.post("/api/execute", async (req, res) => {
    const { code, language, fileName } = req.body;

    if (!code || !language) {
      return res.status(400).json({ error: "Code and language are required" });
    }

    const tempDir = path.join(process.cwd(), "temp_exec");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }

    const ext = language === "python" ? ".py" : ".js";
    // Flatten the filename to avoid directory issues (e.g., src/App.tsx -> src_App.tsx.js)
    const flattenedName = fileName ? fileName.replace(/[\/\\]/g, "_") : `temp_${Date.now()}`;
    const actualFileName = flattenedName.endsWith(ext) ? flattenedName : flattenedName + ext;
    const filePath = path.join(tempDir, actualFileName);

    try {
      fs.writeFileSync(filePath, code);

      const command = language === "python" ? "python3" : "node";
      const process = spawn(command, [filePath]);

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      process.stdout.on("data", (data) => {
        res.write(`data: ${JSON.stringify({ type: "stdout", content: data.toString() })}\n\n`);
      });

      process.stderr.on("data", (data) => {
        res.write(`data: ${JSON.stringify({ type: "stderr", content: data.toString() })}\n\n`);
      });

      process.on("close", (code) => {
        res.write(`data: ${JSON.stringify({ type: "exit", content: code })}\n\n`);
        res.end();
        // Cleanup
        try {
          fs.unlinkSync(filePath);
        } catch (e) {
          console.error("Cleanup error:", e);
        }
      });

      process.on("error", (err) => {
        res.write(`data: ${JSON.stringify({ type: "error", content: err.message })}\n\n`);
        res.end();
      });

      // Timeout after 30 seconds
      setTimeout(() => {
        process.kill();
      }, 30000);

    } catch (error) {
      console.error("Execution error:", error);
      res.status(500).json({ error: "Failed to execute code" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
