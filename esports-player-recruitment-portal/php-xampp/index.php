<?php
/**
 * index.php
 * หน้าแรกของระบบ: ข้อมูลแนะนำโครงการ, บอร์ดรับสมัครนักกีฬา Esports และฟอร์มเข้าสู่ระบบ (Login)
 */

// เริ่มต้น Session สำหรับใช้งานข้อมูลการล็อกอิน
session_start();

// นำเข้าไฟล์เชื่อมต่อฐานข้อมูล
require_once 'db.php';

// ตรวจสอบว่าผู้ใช้ล็อกอินอยู่แล้วหรือไม่ หากล็อกอินอยู่แล้วให้ข้ามไปหน้าเกมทันที
if (isset($_SESSION['user_id'])) {
    header("Location: game.php");
    exit();
}

$error_message = '';

// ตรวจสอบการส่งข้อมูลฟอร์ม Login แบบ POST
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = trim($_POST['username'] ?? '');
    $password = $_POST['password'] ?? '';

    if (!empty($username) && !empty($password)) {
        try {
            // ค้นหาผู้ใช้จากตาราง users ด้วย username
            $stmt = $pdo->prepare("SELECT * FROM users WHERE username = :username LIMIT 1");
            $stmt->execute(['username' => $username]);
            $user = $stmt->fetch();

            // ตรวจสอบรหัสผ่านที่กรอกมา เทียบกับรหัสผ่านแบบแฮชในฐานข้อมูล
            if ($user && password_verify($password, $user['password'])) {
                // บันทึกสถานะการล็อกอินลงใน Session
                $_SESSION['user_id'] = $user['id'];
                $_SESSION['username'] = $user['username'];
                $_SESSION['full_name'] = $user['full_name'];
                $_SESSION['email'] = $user['email'];

                // ส่งผู้เล่นไปยังหน้าทดสอบฝีมือ (game.php)
                header("Location: game.php");
                exit();
            } else {
                $error_message = 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง!';
            }
        } catch (PDOException $e) {
            $error_message = 'เกิดข้อผิดพลาดของระบบ: ' . $e->getMessage();
        }
    } else {
        $error_message = 'กรุณากรอกข้อมูลให้ครบถ้วน!';
    }
}
?>
<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CYBER-LEGION | รับสมัครนักกีฬา Esports</title>
    <!-- นำเข้า Google Fonts เพื่อความโฉบเฉี่ยวสไตล์เกมมิ่ง -->
    <link href="https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@300;400;500;600;700&family=Orbitron:wght@400;700;900&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg-color: #0b0c10;
            --card-color: #1f2833;
            --primary-neon: #00f0ff; /* ฟ้าสว่างนีออน */
            --secondary-neon: #39ff14; /* เขียวนีออน */
            --danger-neon: #ff0055;
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
            background-image: 
                radial-gradient(circle at 10% 20%, rgba(0, 240, 255, 0.05) 0%, transparent 40%),
                radial-gradient(circle at 90% 80%, rgba(57, 255, 20, 0.05) 0%, transparent 40%);
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            overflow-x: hidden;
        }

        /* ส่วนหัว / แถบเมนู */
        header {
            border-bottom: 2px solid rgba(0, 240, 255, 0.2);
            background-color: rgba(11, 12, 16, 0.85);
            backdrop-filter: blur(10px);
            padding: 1.5rem 2rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
            position: sticky;
            top: 0;
            z-index: 100;
        }

        .logo {
            font-family: 'Orbitron', sans-serif;
            font-size: 1.8rem;
            font-weight: 900;
            letter-spacing: 2px;
            color: #ffffff;
            text-shadow: 0 0 10px var(--primary-neon), 0 0 20px rgba(0, 240, 255, 0.5);
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .logo span {
            color: var(--primary-neon);
        }

        /* กล่องหลักจัดเลย์เอาต์ */
        .container {
            max-width: 1200px;
            margin: 3rem auto;
            padding: 0 1.5rem;
            display: grid;
            grid-template-columns: 1.2fr 0.8fr;
            gap: 3rem;
            flex-grow: 1;
            align-items: center;
        }

        @media (max-width: 900px) {
            .container {
                grid-template-columns: 1fr;
                margin: 1.5rem auto;
                gap: 2rem;
            }
        }

        /* ข้อมูลโปรเจกต์ */
        .hero-info {
            display: flex;
            flex-direction: column;
            gap: 1.5rem;
        }

        .badge {
            display: inline-block;
            background: rgba(0, 240, 255, 0.1);
            border: 1px solid var(--primary-neon);
            color: var(--primary-neon);
            padding: 0.4rem 1rem;
            font-size: 0.9rem;
            font-weight: 600;
            text-transform: uppercase;
            border-radius: 4px;
            align-self: flex-start;
            letter-spacing: 1px;
            box-shadow: 0 0 10px rgba(0, 240, 255, 0.2);
        }

        .hero-title {
            font-family: 'Orbitron', sans-serif;
            font-size: 3rem;
            font-weight: 700;
            line-height: 1.2;
            color: #ffffff;
        }

        .hero-title span {
            color: transparent;
            -webkit-text-stroke: 1.5px var(--primary-neon);
            filter: drop-shadow(0 0 10px rgba(0, 240, 255, 0.5));
        }

        .hero-desc {
            font-size: 1.1rem;
            line-height: 1.8;
            color: #a3a8b4;
        }

        .features {
            margin-top: 1rem;
            display: flex;
            flex-direction: column;
            gap: 1rem;
        }

        .feature-item {
            display: flex;
            align-items: flex-start;
            gap: 12px;
            background: rgba(31, 40, 51, 0.4);
            border-left: 3px solid var(--primary-neon);
            padding: 1rem;
            border-radius: 0 8px 8px 0;
            transition: transform 0.3s ease;
        }

        .feature-item:hover {
            transform: translateX(5px);
            background: rgba(31, 40, 51, 0.7);
        }

        .feature-icon {
            font-size: 1.3rem;
            color: var(--primary-neon);
        }

        /* ส่วนของฟอร์ม Login */
        .login-card {
            background-color: var(--card-color);
            border: 1px solid rgba(0, 240, 255, 0.15);
            border-radius: 12px;
            padding: 2.5rem;
            position: relative;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5), 0 0 20px rgba(0, 240, 255, 0.05);
            overflow: hidden;
        }

        .login-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 4px;
            background: linear-gradient(90deg, var(--primary-neon), var(--secondary-neon));
        }

        .card-title {
            font-family: 'Orbitron', sans-serif;
            font-size: 1.6rem;
            color: #ffffff;
            margin-bottom: 0.5rem;
            letter-spacing: 1px;
            text-align: center;
        }

        .card-subtitle {
            font-size: 0.9rem;
            color: #8b949e;
            margin-bottom: 2rem;
            text-align: center;
        }

        .form-group {
            margin-bottom: 1.5rem;
        }

        .form-label {
            display: block;
            font-size: 0.9rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 0.5rem;
            color: #a3a8b4;
        }

        .form-control {
            width: 100%;
            background-color: rgba(11, 12, 16, 0.8);
            border: 1px solid rgba(197, 198, 199, 0.2);
            border-radius: 6px;
            padding: 0.8rem 1rem;
            color: #ffffff;
            font-family: inherit;
            font-size: 1rem;
            transition: all 0.3s ease;
        }

        .form-control:focus {
            outline: none;
            border-color: var(--primary-neon);
            box-shadow: 0 0 10px rgba(0, 240, 255, 0.2);
        }

        .btn {
            width: 100%;
            padding: 0.9rem;
            border: none;
            border-radius: 6px;
            font-family: 'Orbitron', sans-serif;
            font-weight: 700;
            font-size: 1rem;
            cursor: pointer;
            text-transform: uppercase;
            letter-spacing: 1px;
            transition: all 0.3s ease;
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 8px;
        }

        .btn-primary {
            background: linear-gradient(135deg, #00f0ff 0%, #0077ff 100%);
            color: #0b0c10;
            box-shadow: 0 4px 15px rgba(0, 240, 255, 0.3);
        }

        .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(0, 240, 255, 0.5);
        }

        .btn-primary:active {
            transform: translateY(0);
        }

        .register-link {
            text-align: center;
            margin-top: 1.5rem;
            font-size: 0.9rem;
        }

        .register-link a {
            color: var(--primary-neon);
            text-decoration: none;
            font-weight: bold;
            transition: all 0.3s ease;
        }

        .register-link a:hover {
            text-shadow: 0 0 8px rgba(0, 240, 255, 0.6);
            text-decoration: underline;
        }

        /* กล่องแจ้งเตือนความผิดพลาด */
        .alert-danger {
            background-color: rgba(255, 0, 85, 0.1);
            border: 1px solid var(--danger-neon);
            color: #ff9fb2;
            padding: 0.8rem;
            border-radius: 6px;
            font-size: 0.9rem;
            margin-bottom: 1.5rem;
            text-align: center;
            text-shadow: 0 0 5px rgba(255, 0, 85, 0.2);
        }

        /* ส่วนท้าย */
        footer {
            margin-top: auto;
            text-align: center;
            padding: 2rem;
            border-top: 1px solid rgba(197, 198, 199, 0.1);
            font-size: 0.85rem;
            color: #666;
            font-family: 'Orbitron', sans-serif;
            letter-spacing: 1px;
        }
    </style>
</head>
<body>

    <header>
        <div class="logo">
            CYBER<span>_LEGION</span>
        </div>
        <div style="font-family: 'Orbitron'; font-size: 0.9rem; color: var(--primary-neon); letter-spacing: 1.5px; border-bottom: 1px solid;">
            SYSTEM STATUS: ONLINE
        </div>
    </header>

    <div class="container" id="main-content">
        <!-- ด้านซ้าย: ข้อมูลโครงการรับสมัครและคัดเลือกตัวนักกีฬา -->
        <div class="hero-info" id="recruit-info">
            <span class="badge">E-Sports Recruitment Drive</span>
            <h1 class="hero-title">
                BECOME THE NEXT<br>
                <span>CYBER ATHLETE</span>
            </h1>
            <p class="hero-desc">
                ยินดีต้อนรับสู่สโมสร <strong>CYBER-LEGION</strong> สังกัดอีสปอร์ตระดับแนวหน้าของเอเชีย เราเปิดรับสมัครเกมเมอร์รุ่นใหม่ไฟแรงที่มีฝีมือและความฝันก้าวไปสู่เวทีระดับนานาชาติ เพื่อลงแข่งขันในลีกอาชีพชั้นนำ!
            </p>
            
            <div class="features">
                <div class="feature-item" id="talent-test-card">
                    <span class="feature-icon">⚡</span>
                    <div>
                        <strong style="color: #ffffff; display: block; margin-bottom: 4px;">Arcade AI Hand-Tracking Test</strong>
                        <span>เข้าทดสอบปฏิกิริยาตอบสนองทางร่างกายแบบล้ำสมัย ด้วยระบบ AR Hand-Tracking ตรวจจับการเคลื่อนไหวมือของคุณผ่านกล้องโดยไม่ใช้เมาส์!</span>
                    </div>
                </div>
                <div class="feature-item" id="training-card">
                    <span class="feature-icon">🏆</span>
                    <div>
                        <strong style="color: #ffffff; display: block; margin-bottom: 4px;">Professional Coaching & Boot Camp</strong>
                        <span>ผ่านการคัดเลือกเพื่อรับโอกาสเข้าบู้ทแคมป์ฝึกซ้อมกับโค้ชและนักวิเคราะห์แผนการเล่นระดับแชมป์โลก พร้อมเงินเดือนและสวัสดิการเต็มขั้น!</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- ด้านขวา: ฟอร์ม Login -->
        <div class="login-card" id="login-container">
            <h2 class="card-title">ACCESS DENIED</h2>
            <p class="card-subtitle">โปรดระบุข้อมูลส่วนบุคคลเพื่อก้าวเข้าสู่สนามประลอง</p>

            <!-- แสดงข้อความเตือนหากล็อกอินล้มเหลว -->
            <?php if (!empty($error_message)): ?>
                <div class="alert-danger" id="login-error-alert"><?php echo htmlspecialchars($error_message); ?></div>
            <?php endif; ?>

            <form action="index.php" method="POST" id="login-form">
                <div class="form-group">
                    <label class="form-label" for="username">Username</label>
                    <input type="text" name="username" id="username" class="form-control" placeholder="ระบุชื่อผู้ใช้งาน" required autocomplete="off">
                </div>
                <div class="form-group">
                    <label class="form-label" for="password">Password</label>
                    <input type="password" name="password" id="password" class="form-control" placeholder="ระบุรหัสผ่าน" required>
                </div>
                
                <button type="submit" class="btn btn-primary" id="btn-login">
                    ENTER GATEWAY <span>➔</span>
                </button>
            </form>

            <div class="register-link">
                ยังไม่มีข้อมูลผู้สมัคร? <a href="register.php" id="link-to-register">ลงทะเบียนนักกีฬาใหม่ ➔</a>
            </div>
        </div>
    </div>

    <footer>
        &copy; 2026 CYBER-LEGION RECRUITMENT PORTAL. ALL RIGHTS RESERVED. POWERED BY MEDIAPIPE AR.
    </footer>

</body>
</html>
