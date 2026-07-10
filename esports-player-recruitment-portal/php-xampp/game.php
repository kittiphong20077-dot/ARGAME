<?php
/**
 * game.php
 * หน้าทดสอบฝีมือ: ระบบทดสอบการจับภาพมือด้วยกล้องเว็บแคม (MediaPipe Hands Tracking)
 * กติกา: เลื่อนนิ้วชี้สัมผัสดวงดาวนีออนเพื่อรับคะแนน และบันทึกสถิติลงฐานข้อมูลแบบเรียลไทม์
 */

session_start();
require_once 'db.php';

// 1. ตรวจสอบสถานะความปลอดภัย: หากไม่ได้ล็อกอิน ให้เด้งกลับไปหน้าแรกทันที
if (!isset($_SESSION['user_id'])) {
    header("Location: index.php");
    exit();
}

$user_id = $_SESSION['user_id'];

try {
    // 2. ดึงคะแนนสูงสุดล่าสุดของผู้เล่นเพื่อความถูกต้องเสมอ
    $stmt = $pdo->prepare("SELECT full_name, high_score FROM users WHERE id = :id LIMIT 1");
    $stmt->execute(['id' => $user_id]);
    $user = $stmt->fetch();
    
    if (!$user) {
        // หากไม่พบไอดีในฐานข้อมูล ให้ล้าง Session และนำกลับหน้าแรก
        session_destroy();
        header("Location: index.php");
        exit();
    }

    $player_name = htmlspecialchars($user['full_name']);
    $high_score = intval($user['high_score']);

} catch (PDOException $e) {
    die("เกิดข้อผิดพลาดในการดึงข้อมูลผู้สมัคร: " . $e->getMessage());
}
?>
<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CYBER-LEGION | AR HAND ASSESSMENT</title>
    <link href="https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@300;400;500;600;700&family=Orbitron:wght@400;700;900&display=swap" rel="stylesheet">
    
    <!-- นำเข้า MediaPipe Hands และโมดูลช่วยควบคุมกล้อง (ผ่านระบบ CDN) -->
    <script src="https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js" crossorigin="anonymous"></script>
    <script src="https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js" crossorigin="anonymous"></script>

    <style>
        :root {
            --bg-color: #0b0c10;
            --card-color: #1f2833;
            --primary-neon: #00f0ff;
            --secondary-neon: #39ff14;
            --danger-neon: #ff0055;
            --warning-neon: #ffcc00;
            --text-color: #c5c6c7;
            --title-color: #ffffff;
        }

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            font-family: 'Chakra Petch', sans-serif;
            background-color: var(--bg-color);
            color: var(--text-color);
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            overflow-x: hidden;
            background-image: radial-gradient(circle at 50% 30%, rgba(0, 240, 255, 0.03) 0%, transparent 60%);
        }

        header {
            border-bottom: 2px solid rgba(0, 240, 255, 0.2);
            background-color: rgba(11, 12, 16, 0.85);
            backdrop-filter: blur(10px);
            padding: 1rem 2rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
            position: relative;
            z-index: 100;
        }

        .logo {
            font-family: 'Orbitron', sans-serif;
            font-size: 1.5rem;
            font-weight: 900;
            letter-spacing: 2px;
            color: #ffffff;
            text-shadow: 0 0 10px var(--primary-neon);
        }

        .logo span {
            color: var(--primary-neon);
        }

        .user-panel {
            display: flex;
            align-items: center;
            gap: 15px;
        }

        .user-info {
            text-align: right;
        }

        .user-name {
            color: #ffffff;
            font-weight: bold;
            font-size: 1rem;
        }

        .user-status {
            font-size: 0.8rem;
            color: var(--secondary-neon);
            font-family: 'Orbitron', sans-serif;
            letter-spacing: 1px;
        }

        .btn-logout {
            background: transparent;
            border: 1px solid var(--danger-neon);
            color: var(--danger-neon);
            padding: 0.4rem 1rem;
            border-radius: 4px;
            font-family: 'Chakra Petch', sans-serif;
            font-weight: bold;
            cursor: pointer;
            text-decoration: none;
            transition: all 0.3s ease;
        }

        .btn-logout:hover {
            background: var(--danger-neon);
            color: #ffffff;
            box-shadow: 0 0 10px rgba(255, 0, 85, 0.4);
        }

        /* เลย์เอาต์หลักสไตล์หน้าบอร์ดและโซนทดสอบ */
        .game-grid {
            max-width: 1300px;
            margin: 2rem auto;
            padding: 0 1.5rem;
            display: grid;
            grid-template-columns: 1fr 350px;
            gap: 2rem;
            width: 100%;
            flex-grow: 1;
        }

        @media (max-width: 1000px) {
            .game-grid {
                grid-template-columns: 1fr;
            }
        }

        /* โซนแสดงผลกล้องและเกม */
        .arena-container {
            display: flex;
            flex-direction: column;
            gap: 1rem;
        }

        .hud-top {
            background: rgba(31, 40, 51, 0.8);
            border: 1px solid rgba(0, 240, 255, 0.2);
            border-radius: 8px;
            padding: 1rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-family: 'Orbitron', sans-serif;
        }

        .hud-item {
            text-align: center;
        }

        .hud-label {
            font-size: 0.8rem;
            color: #8b949e;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 4px;
        }

        .hud-value {
            font-size: 1.5rem;
            font-weight: 900;
            color: #ffffff;
        }

        .hud-value.neon-cyan {
            color: var(--primary-neon);
            text-shadow: 0 0 10px rgba(0, 240, 255, 0.5);
        }

        .hud-value.neon-green {
            color: var(--secondary-neon);
            text-shadow: 0 0 10px rgba(57, 255, 20, 0.5);
        }

        .canvas-wrapper {
            position: relative;
            width: 100%;
            aspect-ratio: 4/3;
            max-height: 520px;
            background: #000;
            border: 2px solid var(--primary-neon);
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 0 20px rgba(0, 240, 255, 0.15);
            display: flex;
            justify-content: center;
            align-items: center;
        }

        /* ซ่อนกล้องดิบเพื่อนำไปประมวลผลวาดกระจกใน Canvas แทน */
        #webcam-video {
            display: none;
        }

        #game-canvas {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            object-fit: cover;
        }

        /* จอซ้อนแสดงสถานะโหลดเว็บแคม */
        .loading-overlay {
            position: absolute;
            background-color: var(--bg-color);
            color: #ffffff;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            gap: 15px;
            z-index: 10;
            width: 100%;
            height: 100%;
        }

        .loader {
            width: 50px;
            height: 50px;
            border: 4px solid rgba(0, 240, 255, 0.1);
            border-top-color: var(--primary-neon);
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        /* เมนูตั้งค่าคุมเกม */
        .control-panel {
            display: flex;
            gap: 10px;
            justify-content: center;
        }

        .btn-game {
            flex-grow: 1;
            padding: 0.8rem 1.5rem;
            border: none;
            border-radius: 6px;
            font-family: 'Orbitron', sans-serif;
            font-weight: 700;
            font-size: 0.95rem;
            cursor: pointer;
            text-transform: uppercase;
            letter-spacing: 1px;
            transition: all 0.3s ease;
        }

        .btn-start {
            background: linear-gradient(135deg, var(--secondary-neon) 0%, #009911 100%);
            color: #0b0c10;
            box-shadow: 0 4px 15px rgba(57, 255, 20, 0.3);
        }

        .btn-start:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 25px rgba(57, 255, 20, 0.5);
        }

        /* แผงขวา: คำอธิบายและคะแนนประวัติ */
        .sidebar {
            background: rgba(31, 40, 51, 0.6);
            border: 1px solid rgba(197, 198, 199, 0.1);
            border-radius: 12px;
            padding: 2rem;
            display: flex;
            flex-direction: column;
            gap: 1.5rem;
        }

        .sidebar-title {
            font-family: 'Orbitron', sans-serif;
            color: #ffffff;
            font-size: 1.2rem;
            border-bottom: 1px solid rgba(0, 240, 255, 0.2);
            padding-bottom: 0.8rem;
            letter-spacing: 1px;
        }

        .instruction-step {
            display: flex;
            gap: 12px;
            font-size: 0.9rem;
            line-height: 1.5;
        }

        .step-num {
            background-color: var(--primary-neon);
            color: #0b0c10;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            display: flex;
            justify-content: center;
            align-items: center;
            font-weight: bold;
            font-family: 'Orbitron', sans-serif;
            flex-shrink: 0;
            font-size: 0.8rem;
        }

        .feedback-toast {
            background-color: rgba(0, 240, 255, 0.1);
            border: 1px solid var(--primary-neon);
            border-radius: 6px;
            padding: 1rem;
            font-size: 0.9rem;
            color: #ffffff;
            text-align: center;
            transition: all 0.3s ease;
            box-shadow: 0 0 15px rgba(0, 240, 255, 0.1);
            display: none;
        }

        footer {
            margin-top: auto;
            text-align: center;
            padding: 2rem;
            border-top: 1px solid rgba(197, 198, 199, 0.1);
            font-size: 0.85rem;
            color: #666;
            font-family: 'Orbitron', sans-serif;
        }
    </style>
</head>
<body>

    <header>
        <div class="logo">
            CYBER<span>_LEGION</span>
        </div>
        <div class="user-panel">
            <div class="user-info">
                <div class="user-name" id="user-display-name"><?php echo $player_name; ?></div>
                <div class="user-status" id="user-display-status">VERIFIED PLAYER_</div>
            </div>
            <a href="logout.php" class="btn-logout" id="link-logout">LOGOUT</a>
        </div>
    </header>

    <div class="game-grid">
        
        <!-- โซนตัวเกม -->
        <div class="arena-container">
            <div class="hud-top">
                <div class="hud-item">
                    <div class="hud-label">TIME LIMIT</div>
                    <div class="hud-value neon-cyan" id="hud-timer">30S</div>
                </div>
                <div class="hud-item">
                    <div class="hud-label">CURRENT SCORE</div>
                    <div class="hud-value" id="hud-score">0</div>
                </div>
                <div class="hud-item">
                    <div class="hud-label">YOUR RECORD</div>
                    <div class="hud-value neon-green" id="hud-record"><?php echo $high_score; ?> PTS</div>
                </div>
            </div>

            <div class="canvas-wrapper">
                <!-- จอคัดลอกรูปภาพกล้องที่ใช้ประมวลผลเบื้องหลัง -->
                <video id="webcam-video" autoplay playsinline></video>
                
                <!-- ตัววาดผลลัพธ์เกมและการตรวจจับมือ -->
                <canvas id="game-canvas"></canvas>

                <!-- โหลดกล้องและโมเดล AI -->
                <div class="loading-overlay" id="preloader">
                    <div class="loader"></div>
                    <p style="font-family: 'Orbitron'; letter-spacing: 2px; font-size: 0.9rem;" id="loading-txt">INITIALIZING AR SENSORS...</p>
                    <p style="font-size: 0.8rem; color: #666;">กรุณาอนุญาตการเข้าถึงกล้องเว็บแคมเมื่อระบบร้องขอ</p>
                </div>
            </div>

            <div class="control-panel">
                <button class="btn-game btn-start" id="btn-play-game">START TALENT TEST ➔</button>
            </div>
        </div>

        <!-- โซนแนะนำการใช้งานและแจ้งคะแนน -->
        <div class="sidebar">
            <h3 class="sidebar-title">TALENT TESTING GUIDE</h3>
            
            <div class="instruction-step">
                <div class="step-num">1</div>
                <div>อนุญาตกล้องเว็บแคมและกางมือขึ้นตรงหน้ากล้องจนกว่าระบบ AI จะลากโครงร่างข้อต่อสีฟ้านีออนขึ้นบนหน้าจอของคุณสำเร็จ</div>
            </div>

            <div class="instruction-step">
                <div class="step-num">2</div>
                <div>กดปุ่ม <strong>"START TALENT TEST"</strong> เพื่อเริ่มจับเวลา 30 วินาที</div>
            </div>

            <div class="instruction-step">
                <div class="step-num">3</div>
                <div>ควบคุม <strong>"ปลายนิ้วชี้"</strong> หรือ <strong>"ฝ่ามือ"</strong> เลื่อนหน้าจอไปแตะสัมผัส "ดวงดาวสีทอง" บนหน้าจอเพื่อรับ 1 แต้ม ดาวจะแรนดอมไปจุติ ณ จุดอื่นเพื่อคัดฝีมือและการปัดประสาทปฏิกิริยา</div>
            </div>

            <div class="instruction-step">
                <div class="step-num">4</div>
                <div>เมื่อหมดเวลาลง คะแนนที่ดีที่สุดจะถูกยิงผ่าน <strong>Fetch API (AJAX)</strong> บันทึกเก็บเป็นประวัติในตารางสถิตินักกีฬาของท่านทันที!</div>
            </div>

            <!-- กล่องแจ้งเตือนความคืบหน้าการส่งข้อมูล -->
            <div class="feedback-toast" id="score-update-toast">
                ระบบเซฟข้อมูลสถิติเรียบร้อยแล้ว!
            </div>
        </div>

    </div>

    <footer>
        &copy; 2026 CYBER-LEGION RECRUITMENT PORTAL. POWERED BY MEDIAPIPE HANDS ENGINE.
    </footer>

    <!-- ส่วนเขียนโค้ดคุมเกมเชิงลึก (JavaScript) -->
    <script>
        // ประกาศตัวแปรอ้างอิง DOM Elements
        const videoElement = document.getElementById('webcam-video');
        const canvasElement = document.getElementById('game-canvas');
        const canvasCtx = canvasElement.getContext('2d');
        const preloader = document.getElementById('preloader');
        const loadingTxt = document.getElementById('loading-txt');
        const btnPlay = document.getElementById('btn-play-game');
        
        const hudTimer = document.getElementById('hud-timer');
        const hudScore = document.getElementById('hud-score');
        const hudRecord = document.getElementById('hud-record');
        const scoreToast = document.getElementById('score-update-toast');

        // ข้อมูลตัวเกม
        let isPlaying = false;
        let score = 0;
        let timeLeft = 30;
        let gameTimer = null;
        let registeredRecord = <?php echo $high_score; ?>;

        // วัตถุดวงดาวเป้าหมาย (พิกัดดาวเริ่มต้น x, y และขนาดรัศมี r)
        let star = { x: 0.5, y: 0.5, r: 25, pulse: 1, dir: 1 };
        
        // ตัวเก็บตำแหน่งพิกัดนิ้วชี้ล่าสุดที่ตรวจจับได้
        let pointerPosition = { x: -1, y: -1 };

        // สุ่มจุดกำเนิดใหม่ของดวงดาว
        function spawnStar() {
            star.x = 0.15 + Math.random() * 0.7; // สุ่มในช่วงร้อยละ 15 - 85 ป้องกันชิดขอบจอเกินไป
            star.y = 0.15 + Math.random() * 0.7;
        }

        // จัดแจงขนาด Canvas ให้เต็มเฟรมเฟล็กซ์
        function resizeCanvas() {
            canvasElement.width = canvasElement.parentElement.clientWidth;
            canvasElement.height = canvasElement.parentElement.clientHeight;
        }
        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();

        // 1. กำหนดค่าเริ่มต้นสำหรับ MediaPipe Hands
        const hands = new Hands({
            locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
        });

        hands.setOptions({
            maxNumHands: 1, // ตรวจจับแค่ 1 มือเพื่อความลื่นไหลสูงสุด
            modelComplexity: 1,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5
        });

        // 2. จัดการเมื่อประมวลผลข้อมูลมือที่เข้ามาสำเร็จ
        hands.onResults((results) => {
            // ปิดตัวหน้าจอ Preloader เมื่อ AI เริ่มทำงานได้สำเร็จ
            if (preloader.style.display !== 'none') {
                preloader.style.display = 'none';
            }

            // ล้างหน้าจอ Canvas
            canvasCtx.save();
            canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

            // วาดภาพวิดีโอดิบกลับด้านซ้ายขวา (Mirror) ลงบน Canvas เพื่อให้เล่นง่ายเหมือนกระจกเงา
            canvasCtx.translate(canvasElement.width, 0);
            canvasCtx.scale(-1, 1);
            canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

            // รีเซ็ตการแปลงค่า เพื่อให้สามารถวาดข้อมูลที่ตั้งใจแบบปกติได้ (พิกัดกลับด้านกระจกเรียบร้อย)
            canvasCtx.restore();

            pointerPosition.x = -1;
            pointerPosition.y = -1;

            // ตรวจสอบว่ากล้องส่องเจอมือผู้เล่นหรือไม่
            if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
                const handLandmarks = results.multiHandLandmarks[0];

                // ดึงพิกัดนิ้วชี้ (INDEX_FINGER_TIP: จุดหมายเลข 8 ใน MediaPipe)
                const indexFingerTip = handLandmarks[8];
                
                // เนื่องจากภาพถูกสลับซ้ายขวา (Mirror) เราต้องสะท้อนค่าแกน X กลับมาให้ตรง
                pointerPosition.x = (1 - indexFingerTip.x) * canvasElement.width;
                pointerPosition.y = indexFingerTip.y * canvasElement.height;

                // วาดเอฟเฟกต์การชี้เป้าด้วยโครงข่ายข้อต่อ (Cyberpunk Matrix Wireframe)
                drawHandCyberpunkStyle(handLandmarks);
            }

            // วาดดาวเป้าหมายและอัพเดทตรรกะเกมเมื่อเข้าโหมดเล่นอยู่
            if (isPlaying) {
                updateGameLogic();
            }
            
            drawStarEffect();
        });

        // วาดมือเป็นสไตล์ Cyberpunk (จุดสว่างสีเขียวนีออน และเส้นเชือมฟ้านีออน)
        function drawHandCyberpunkStyle(landmarks) {
            // ความสัมพันธ์ดัชนีจุดของกระดูกนิ้วมือเพื่อลากเส้น
            const connections = [
                [0, 1], [1, 2], [2, 3], [3, 4],       // นิ้วหัวแม่มือ
                [0, 5], [5, 6], [6, 7], [7, 8],       // นิ้วชี้
                [0, 17], [5, 9], [9, 13], [13, 17],   // ฝ่ามือหลัก
                [9, 10], [10, 11], [11, 12],          // นิ้วกลาง
                [13, 14], [14, 15], [15, 16],         // นิ้วนาง
                [17, 18], [18, 19], [19, 20]          // นิ้วก้อย
            ];

            // 1. วาดเส้นขอบร่าง (Wireframe) ฟ้านีออน
            canvasCtx.lineWidth = 3;
            canvasCtx.strokeStyle = '#00f0ff';
            canvasCtx.shadowColor = '#00f0ff';
            canvasCtx.shadowBlur = 8;

            connections.forEach(([p1, p2]) => {
                const x1 = (1 - landmarks[p1].x) * canvasElement.width;
                const y1 = landmarks[p1].y * canvasElement.height;
                const x2 = (1 - landmarks[p2].x) * canvasElement.width;
                const y2 = landmarks[p2].y * canvasElement.height;

                canvasCtx.beginPath();
                canvasCtx.moveTo(x1, y1);
                canvasCtx.lineTo(x2, y2);
                canvasCtx.stroke();
            });

            // 2. วาดจุดข้อต่อกระดูกสีเขียวนีออนสะท้อนแสง
            canvasCtx.shadowBlur = 10;
            canvasCtx.shadowColor = '#39ff14';
            canvasCtx.fillStyle = '#39ff14';

            for (let i = 0; i < landmarks.length; i++) {
                const x = (1 - landmarks[i].x) * canvasElement.width;
                const y = landmarks[i].y * canvasElement.height;

                canvasCtx.beginPath();
                canvasCtx.arc(x, y, i === 8 ? 8 : 4, 0, 2 * Math.PI); // ขยายจุดขี้นิ้วชี้ให้ใหญ่เพื่อความสะดวก
                canvasCtx.fill();
            }
            
            // รีเซ็ตการฟุ้งของเงาพิกเซล
            canvasCtx.shadowBlur = 0;
        }

        // อัพเดทความสัมพันธ์ดวงดวงกับปลายนิ้วชี้
        function updateGameLogic() {
            if (pointerPosition.x !== -1 && pointerPosition.y !== -1) {
                const starActualX = star.x * canvasElement.width;
                const starActualY = star.y * canvasElement.height;

                // คำนวณหาระยะทางแบบ Euclidean Distance ระหว่างเป้านิ้วชี้และดาว
                const dist = Math.hypot(pointerPosition.x - starActualX, pointerPosition.y - starActualY);

                // หากนิ้วเข้าใกล้มือในรัศมีวงของดาว (ดาวสัมผัสสำเร็จ)
                if (dist < star.r + 15) {
                    score += 1;
                    hudScore.innerText = score;
                    
                    // สุ่มดวงดาวไปเกิดใหม่ทันที
                    spawnStar();
                }
            }
        }

        // วาดดาวเรืองแสงด้วย Canvas API
        function drawStarEffect() {
            const starActualX = star.x * canvasElement.width;
            const starActualY = star.y * canvasElement.height;

            // เอฟเฟกต์แอนิเมชั่น ขยายหุบ (Pulse) ของดาว
            star.pulse += 0.05 * star.dir;
            if (star.pulse > 1.2 || star.pulse < 0.8) {
                star.dir *= -1;
            }

            const activeRadius = star.r * star.pulse;

            canvasCtx.save();
            canvasCtx.shadowBlur = 20;
            canvasCtx.shadowColor = isPlaying ? '#ffcc00' : '#888888';
            canvasCtx.fillStyle = isPlaying ? '#ffcc00' : '#444444';

            // วาดรูปดาว 5 แฉก
            canvasCtx.beginPath();
            drawStarPoints(canvasCtx, starActualX, starActualY, 5, activeRadius, activeRadius / 2);
            canvasCtx.fill();
            canvasCtx.restore();
        }

        // ฟังก์ชันวาดลายเส้นสมดุลดาว 5 แฉก
        function drawStarPoints(ctx, cx, cy, spikes, outerRadius, innerRadius) {
            let rot = Math.PI / 2 * 3;
            let x = cx;
            let y = cy;
            let step = Math.PI / spikes;

            ctx.moveTo(cx, cy - outerRadius);
            for (let i = 0; i < spikes; i++) {
                x = cx + Math.cos(rot) * outerRadius;
                y = cy + Math.sin(rot) * outerRadius;
                ctx.lineTo(x, y);
                rot += step;

                x = cx + Math.cos(rot) * innerRadius;
                y = cy + Math.sin(rot) * innerRadius;
                ctx.lineTo(x, y);
                rot += step;
            }
            ctx.lineTo(cx, cy - outerRadius);
            ctx.closePath();
        }

        // 3. ควบคุมเว็บแคมและรันฟีดกล้องส่งเข้าสู่ระบบ MediaPipe
        const camera = new Camera(videoElement, {
            onFrame: async () => {
                await hands.send({ image: videoElement });
            },
            width: 640,
            height: 480
        });

        // เปิดกล้องเว็บแคม
        loadingTxt.innerText = "ACCESSING WEBCAM...";
        camera.start().catch(err => {
            console.error(err);
            loadingTxt.innerHTML = "<span style='color:#ff0055'>CAMERA ACCESS DENIED</span><br>กรุณารันไฟล์ผ่าน https หรืออนุญาตการใช้กล้องของคุณ!";
        });

        // 4. ระบบเริ่มการเล่นเกมทดสอบความสามารถ
        spawnStar();

        btnPlay.addEventListener('click', () => {
            if (isPlaying) return; // ป้องกันการกดเริ่มซ้อน
            
            isPlaying = true;
            score = 0;
            timeLeft = 30;
            hudScore.innerText = score;
            hudTimer.innerText = timeLeft + 'S';
            btnPlay.disabled = true;
            btnPlay.style.opacity = '0.5';
            btnPlay.innerText = 'TESTING IN PROGRESS...';
            scoreToast.style.display = 'none';

            spawnStar();

            // รันไทม์เมอร์นับเวลาถอยหลัง (30 วินาที)
            gameTimer = setInterval(() => {
                timeLeft--;
                hudTimer.innerText = timeLeft + 'S';

                if (timeLeft <= 0) {
                    clearInterval(gameTimer);
                    endGame();
                }
            }, 1000);
        });

        // ยุติการทดสอบฝีมือ และส่งคะแนนกลับฐานข้อมูล
        function endGame() {
            isPlaying = false;
            btnPlay.disabled = false;
            btnPlay.style.opacity = '1';
            btnPlay.innerText = 'START TALENT TEST ➔';
            
            alert(`🏁 สิ้นสุดการทดสอบ! คุณเก็บคะแนนทดสอบไปได้ทั้งสิ้น ${score} แต้ม`);

            // ส่งข้อมูลไปบันทึกลงฐานข้อมูลแบบ AJAX (Fetch API) ทันที
            saveScoreToDB(score);
        }

        // ส่งคะแนนประมวลผลด้วย AJAX ผ่านไฟล์ update_score.php
        function saveScoreToDB(finalScore) {
            scoreToast.style.display = 'block';
            scoreToast.style.borderColor = 'var(--primary-neon)';
            scoreToast.style.color = '#ffffff';
            scoreToast.innerText = '⚡ กำลังส่งค่าคะแนนสถิติกลับเซิร์ฟเวอร์...';

            fetch('update_score.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ score: finalScore })
            })
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    scoreToast.innerText = data.message;
                    if (data.new_record) {
                        scoreToast.style.borderColor = 'var(--secondary-neon)';
                        scoreToast.style.color = 'var(--secondary-neon)';
                        // แสดงแอนิเมชั่นทำลายสถิติเก่า
                        hudRecord.innerText = data.high_score + ' PTS';
                        hudRecord.style.color = 'var(--secondary-neon)';
                    }
                } else {
                    scoreToast.innerText = '❌ เกิดข้อผิดพลาด: ' + data.message;
                    scoreToast.style.borderColor = 'var(--danger-neon)';
                }
            })
            .catch(err => {
                console.error(err);
                scoreToast.innerText = '❌ เกิดความผิดพลาดทางเครือข่ายในการอัปโหลดคะแนน!';
                scoreToast.style.borderColor = 'var(--danger-neon)';
            });
        }
    </script>

</body>
</html>
