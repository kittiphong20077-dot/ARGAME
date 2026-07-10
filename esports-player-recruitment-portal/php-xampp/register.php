<?php
/**
 * register.php
 * หน้าลงทะเบียนนักกีฬาใหม่: รับข้อมูล ชื่อ-นามสกุล, อีเมล, กำหนด Username, Password
 * ตรวจสอบความซ้ำซ้อนของชื่อผู้ใช้ แฮชรหัสผ่านอย่างปลอดภัย และนำเสนอข้อมูลหลังลงทะเบียนสำเร็จ
 */

session_start();
require_once 'db.php';

// ตรวจสอบว่าล็อกอินค้างอยู่หรือไม่ หากล็อกอินอยู่แล้วให้ข้ามไปหน้าเกมเลย
if (isset($_SESSION['user_id'])) {
    header("Location: game.php");
    exit();
}

$error_message = '';
$success_register = false;
$registered_username = '';
$registered_password = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $full_name = trim($_POST['full_name'] ?? '');
    $email = trim($_POST['email'] ?? '');
    $username = trim($_POST['username'] ?? '');
    $password = $_POST['password'] ?? '';

    if (!empty($full_name) && !empty($email) && !empty($username) && !empty($password)) {
        try {
            // 1. ตรวจสอบก่อนว่าชื่อผู้ใช้นี้ซ้ำในระบบหรือไม่
            $stmt = $pdo->prepare("SELECT id FROM users WHERE username = :username LIMIT 1");
            $stmt->execute(['username' => $username]);
            
            if ($stmt->fetch()) {
                $error_message = 'ชื่อผู้ใช้ (Username) นี้ถูกใช้งานแล้วในระบบ กรุณาลองใช้ชื่ออื่น!';
            } else {
                // 2. แฮชรหัสผ่านเพื่อความปลอดภัยสูงสุดก่อนเก็บลงฐานข้อมูล
                $hashed_password = password_hash($password, PASSWORD_DEFAULT);

                // 3. บันทึกข้อมูลลงตาราง users
                $insertStmt = $pdo->prepare("
                    INSERT INTO users (username, password, full_name, email, high_score) 
                    VALUES (:username, :password, :full_name, :email, 0)
                ");
                $insertStmt->execute([
                    'username' => $username,
                    'password' => $hashed_password,
                    'full_name' => $full_name,
                    'email' => $email
                ]);

                // กำหนดตัวแปรสำหรับแจ้งผลสำเร็จพร้อมข้อมูลเข้าสู่ระบบ
                $success_register = true;
                $registered_username = htmlspecialchars($username);
                $registered_password = htmlspecialchars($password); // แสดงรหัสผ่านที่เขาตั้งไว้ให้ดูเด่นชัดตามที่โจทย์ระบุ
            }
        } catch (PDOException $e) {
            $error_message = 'เกิดข้อผิดพลาดในการลงทะเบียน: ' . $e->getMessage();
        }
    } else {
        $error_message = 'กรุณากรอกข้อมูลให้ครบถ้วนทุกช่อง!';
    }
}
?>
<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CYBER-LEGION | ลงทะเบียนนักกีฬา</title>
    <link href="https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@300;400;500;600;700&family=Orbitron:wght@400;700;900&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg-color: #0b0c10;
            --card-color: #1f2833;
            --primary-neon: #00f0ff;
            --secondary-neon: #39ff14;
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
        }

        .logo span {
            color: var(--primary-neon);
        }

        .container {
            max-width: 600px;
            margin: 4rem auto;
            padding: 0 1.5rem;
            width: 100%;
            flex-grow: 1;
        }

        .register-card {
            background-color: var(--card-color);
            border: 1px solid rgba(0, 240, 255, 0.15);
            border-radius: 12px;
            padding: 2.5rem;
            position: relative;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5), 0 0 20px rgba(0, 240, 255, 0.05);
        }

        .register-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 4px;
            background: linear-gradient(90deg, var(--secondary-neon), var(--primary-neon));
        }

        .card-title {
            font-family: 'Orbitron', sans-serif;
            font-size: 1.8rem;
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
            text-decoration: none;
        }

        .btn-success {
            background: linear-gradient(135deg, #39ff14 0%, #00b31e 100%);
            color: #0b0c10;
            box-shadow: 0 4px 15px rgba(57, 255, 20, 0.3);
        }

        .btn-success:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(57, 255, 20, 0.5);
        }

        .btn-secondary {
            background: rgba(197, 198, 199, 0.1);
            color: #ffffff;
            border: 1px solid rgba(197, 198, 199, 0.2);
            margin-top: 1rem;
        }

        .btn-secondary:hover {
            background: rgba(197, 198, 199, 0.2);
        }

        .alert-danger {
            background-color: rgba(255, 0, 85, 0.1);
            border: 1px solid var(--danger-neon);
            color: #ff9fb2;
            padding: 0.8rem;
            border-radius: 6px;
            font-size: 0.9rem;
            margin-bottom: 1.5rem;
            text-align: center;
        }

        /* ส่วนผลลัพธ์การสมัครสำเร็จ */
        .success-box {
            background: rgba(57, 255, 20, 0.05);
            border: 1px solid var(--secondary-neon);
            border-radius: 8px;
            padding: 1.5rem;
            margin-bottom: 1.5rem;
            text-shadow: 0 0 5px rgba(57, 255, 20, 0.2);
        }

        .success-title {
            color: var(--secondary-neon);
            font-size: 1.4rem;
            font-weight: 700;
            margin-bottom: 1rem;
            text-align: center;
            font-family: 'Orbitron', sans-serif;
        }

        .success-info-row {
            display: flex;
            justify-content: space-between;
            padding: 0.6rem 0;
            border-bottom: 1px dashed rgba(57, 255, 20, 0.2);
        }

        .success-info-row:last-child {
            border-bottom: none;
        }

        .success-label {
            color: #a3a8b4;
            font-weight: bold;
        }

        .success-val {
            color: #ffffff;
            font-family: 'Orbitron', monospace;
            font-weight: bold;
        }

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
        <div style="font-family: 'Orbitron'; font-size: 0.9rem; color: var(--secondary-neon); letter-spacing: 1.5px; border-bottom: 1px solid;">
            SECURE REGISTRATION_
        </div>
    </header>

    <div class="container" id="reg-container">
        <div class="register-card" id="form-card">
            
            <?php if ($success_register): ?>
                <!-- แสดงข้อความเมื่อลงทะเบียนสำเร็จตามที่โจทย์ระบุ -->
                <div class="success-box" id="success-display-panel">
                    <h2 class="success-title">✓ สมัครสมาชิกสำเร็จ!</h2>
                    <p style="text-align: center; font-size: 0.95rem; margin-bottom: 1.5rem; color: #d0ffd0;">
                        ข้อมูลนักกีฬาของคุณได้ถูกเข้ารหัสและบันทึกลงในระบบหลักเรียบร้อยแล้ว โปรดใช้บัญชีด้านล่างเพื่อเข้าสู่ระบบ
                    </p>
                    
                    <div class="success-info-row">
                        <span class="success-label">Username:</span>
                        <span class="success-val" id="disp-username" style="color: var(--primary-neon);"><?php echo $registered_username; ?></span>
                    </div>
                    <div class="success-info-row">
                        <span class="success-label">Password:</span>
                        <span class="success-val" id="disp-password" style="color: var(--secondary-neon);"><?php echo $registered_password; ?></span>
                    </div>
                </div>

                <a href="index.php" class="btn btn-success" id="btn-return-login">➔ กลับสู่หน้าล็อกอินแรก</a>

            <?php else: ?>
                <!-- แสดงฟอร์มเมื่อต้องการลงทะเบียนปกติ -->
                <h2 class="card-title">SIGN UP</h2>
                <p class="card-subtitle">สร้างโปรไฟล์ผู้เล่นของคุณเพื่อบันทึกประวัติการทดสอบคัดเลือก</p>

                <?php if (!empty($error_message)): ?>
                    <div class="alert-danger" id="reg-error-alert"><?php echo htmlspecialchars($error_message); ?></div>
                <?php endif; ?>

                <form action="register.php" method="POST" id="register-form">
                    <div class="form-group">
                        <label class="form-label" for="full_name">ชื่อ-นามสกุล (Full Name)</label>
                        <input type="text" name="full_name" id="full_name" class="form-control" placeholder="เช่น มงคล ขยันเล่น" required autocomplete="off" value="<?php echo isset($_POST['full_name']) ? htmlspecialchars($_POST['full_name']) : ''; ?>">
                    </div>

                    <div class="form-group">
                        <label class="form-label" for="email">อีเมล (Email)</label>
                        <input type="email" name="email" id="email" class="form-control" placeholder="เช่น combat@cyberlegion.com" required autocomplete="off" value="<?php echo isset($_POST['email']) ? htmlspecialchars($_POST['email']) : ''; ?>">
                    </div>

                    <div class="form-group">
                        <label class="form-label" for="username">กำหนด Username</label>
                        <input type="text" name="username" id="username" class="form-control" placeholder="ตัวอักษรภาษาอังกฤษหรือตัวเลข" required autocomplete="off" minlength="4">
                    </div>

                    <div class="form-group">
                        <label class="form-label" for="password">กำหนด Password</label>
                        <input type="password" name="password" id="password" class="form-control" placeholder="รหัสผ่านเข้าสู่ระบบ" required minlength="4">
                    </div>

                    <button type="submit" class="btn btn-success" id="btn-save-register">
                        CREATE PROTOCOL ➔
                    </button>
                </form>

                <a href="index.php" class="btn btn-secondary" id="btn-cancel-register">➔ ยกเลิกและกลับหน้าแรก</a>
            <?php endif; ?>

        </div>
    </div>

    <footer>
        &copy; 2026 CYBER-LEGION RECRUITMENT PORTAL. ALL RIGHTS RESERVED.
    </footer>

</body>
</html>
