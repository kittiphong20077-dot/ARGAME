import { useState } from 'react';
import { phpFiles } from '../data/phpCode';
import { FileCode, Download, Copy, Check, Info } from 'lucide-react';

export default function PhpCodeViewer() {
  const [activeFileIndex, setActiveFileIndex] = useState(0);
  const [copied, setCopied] = useState(false);

  const activeFile = phpFiles[activeFileIndex];

  const handleCopy = () => {
    navigator.clipboard.writeText(activeFile.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-[#1f2833] border border-cyan-500/20 rounded-xl overflow-hidden shadow-lg shadow-black/40">
      <div className="p-4 bg-black/40 border-b border-cyan-500/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-white font-orbitron font-bold tracking-wider flex items-center gap-2">
            <FileCode className="text-cyan-400 w-5 h-5" />
            PHP & MYSQL SOURCE CODE FOR XAMPP
          </h3>
          <p className="text-xs text-gray-400 mt-1">
            ดาวน์โหลดหรือคัดลอกไฟล์เหล่านี้ไปวางในโฟลเดอร์ <code className="text-cyan-300 font-mono">htdocs</code> ของ XAMPP เพื่อรันระบบจริง
          </p>
        </div>

        <div className="flex gap-2 self-stretch sm:self-auto">
          <button
            onClick={handleCopy}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/40 rounded text-cyan-300 text-xs font-bold font-orbitron uppercase transition-all duration-300"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-green-400" />
                COPIED!
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                COPY CODE
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 min-h-[450px]">
        {/* Sidebar file selector */}
        <div className="bg-black/20 border-r border-cyan-500/10 p-3 flex flex-row md:flex-col gap-1.5 overflow-x-auto md:overflow-x-visible">
          {phpFiles.map((file, idx) => (
            <button
              key={file.name}
              onClick={() => {
                setActiveFileIndex(idx);
                setCopied(false);
              }}
              className={`flex items-center gap-2.5 px-3 py-2 rounded text-left text-xs font-mono font-bold transition-all duration-200 whitespace-nowrap md:whitespace-normal ${
                activeFileIndex === idx
                  ? 'bg-cyan-500/10 text-cyan-400 border-l-2 border-cyan-400'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
              }`}
            >
              <FileCode className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{file.name}</span>
            </button>
          ))}
        </div>

        {/* Code view panel */}
        <div className="md:col-span-3 flex flex-col bg-[#0b0c10]">
          <div className="p-3 bg-black/30 border-b border-cyan-500/10 flex items-center gap-2.5 text-xs text-gray-400">
            <Info className="w-4 h-4 text-cyan-400 flex-shrink-0" />
            <span className="leading-relaxed">
              <strong>{activeFile.name}</strong>: {activeFile.description}
            </span>
          </div>

          <div className="p-4 flex-1 overflow-auto max-h-[500px]">
            <pre className="text-xs font-mono text-cyan-300/90 leading-relaxed selection:bg-cyan-500/30 selection:text-white">
              <code>{activeFile.code}</code>
            </pre>
          </div>
        </div>
      </div>
      
      {/* Setup Guide footer */}
      <div className="p-4 bg-black/60 border-t border-cyan-500/20 text-xs text-gray-300 space-y-2">
        <span className="font-bold text-cyan-400 font-orbitron block uppercase tracking-wider">🛠️ วิธีตั้งค่าบน XAMPP:</span>
        <ol className="list-decimal pl-4 space-y-1.5 text-gray-400">
          <li>เปิด XAMPP Control Panel และกด <span className="text-white">Start</span> ที่ <span className="text-green-400">Apache</span> และ <span className="text-green-400">MySQL</span></li>
          <li>สร้างโฟลเดอร์ใหม่ชื่อว่า <code className="bg-black px-1.5 py-0.5 rounded text-cyan-300 font-mono text-[11px]">esports-recruitment</code> ไว้ข้างใน <code className="bg-black px-1.5 py-0.5 rounded text-cyan-300 font-mono text-[11px]">C:\xampp\htdocs\</code></li>
          <li>คัดลอกไฟล์ทั้งหมดด้านบน (หรือดาวน์โหลดจากโปรเจกต์นี้) นำไปบันทึกไว้ในโฟลเดอร์ดังกล่าว</li>
          <li>เปิดเว็บบราวเซอร์แล้วไปที่ <a href="http://localhost/phpmyadmin" target="_blank" rel="noopener noreferrer" className="text-cyan-400 underline hover:text-cyan-300">http://localhost/phpmyadmin</a></li>
          <li>สร้างฐานข้อมูลใหม่ชื่อว่า <code className="bg-black px-1.5 py-0.5 rounded text-white font-mono text-[11px]">esports_db</code> และคลิกแท็บ <span className="text-white">SQL</span> เพื่อนำโค้ดในไฟล์ <code className="text-cyan-300 font-mono">database.sql</code> ไปวางและกดรัน (Go)</li>
          <li>รันระบบผ่านลิงก์ <a href="http://localhost/esports-recruitment/index.php" target="_blank" rel="noopener noreferrer" className="text-cyan-400 underline hover:text-cyan-300 font-mono">http://localhost/esports-recruitment/index.php</a></li>
        </ol>
      </div>
    </div>
  );
}
