import { PHPFile } from '../types';

export const phpFiles: PHPFile[] = [
  {
    name: 'db.php',
    language: 'php',
    description: 'ไฟล์สำหรับเชื่อมต่อฐานข้อมูล MySQL ด้วย PDO และสร้างฐานข้อมูล/ตารางอัตโนมัติใน XAMPP',
    code: `<?php
/**
 * db.php
 * ไฟล์เชื่อมต่อฐานข้อมูล MySQL ด้วย PDO และรองรับการสร้างฐานข้อมูล/ตารางอัตโนมัติเพื่อความสะดวกใน XAMPP
 */

$host = 'localhost';
$db_user = 'root'; // ค่าเริ่มต้นของ XAMPP
$db_pass = '';     // ค่าเริ่มต้นของ XAMPP (ว่างเปล่า)
$db_name = 'esports_db';

try {
    // 1. เชื่อมต่อกับ MySQL (ยังไม่ระบุชื่อฐานข้อมูล เพื่อทำการตรวจสอบและสร้างใหม่หากไม่มี)
    $pdo = new PDO("mysql:host=$host;charset=utf8mb4", $db_user, $db_pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

    // 2. สร้างฐานข้อมูลหากยังไม่มี
    $pdo->exec("CREATE DATABASE IF NOT EXISTS \`$db_name\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    
    // 3. เลือกใช้งานฐานข้อมูลที่กำหนด
    $pdo->exec("USE \`$db_name\`");

    // 4. สร้างตาราง users หากยังไม่มี
    $createTableQuery = "
        CREATE TABLE IF NOT EXISTS \`users\` (
            \`id\` INT AUTO_INCREMENT PRIMARY KEY,
            \`username\` VARCHAR(50) NOT NULL UNIQUE,
            \`password\` VARCHAR(255) NOT NULL,
            \`full_name\` VARCHAR(100) NOT NULL,
            \`email\` VARCHAR(100) NOT NULL,
            \`high_score\` INT DEFAULT 0,
            \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ";
    $pdo->exec($createTableQuery);

} catch (PDOException $e) {
    // หากเชื่อมต่อล้มเหลว ให้แสดงข้อความผิดพลาด
    die("เชื่อมต่อฐานข้อมูลล้มเหลว: " . $e->getMessage());
}
?>`
  },
  {
    name: 'index.php',
    language: 'php',
    description: 'หน้าแรกของเว็บไซต์: รายละเอียดโครงการรับสมัคร, บอร์ด E-Sports, ฟอร์มล็อกอิน, และลิงก์ไปยังหน้าลงทะเบียน',
    code: `<?php
/**
 * index.php
 * หน้าแรกของระบบ: ข้อมูลแนะนำโครงการ, บอร์ดรับสมัครนักกีฬา Esports และฟอร์มเข้าสู่ระบบ (Login)
 */

session_start();
require_once 'db.php';

if (isset($_SESSION['user_id'])) {
    header("Location: game.php");
    exit();
}

$error_message = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = trim($_POST['username'] ?? '');
    $password = $_POST['password'] ?? '';

    if (!empty($username) && !empty($password)) {
        try {
            $stmt = $pdo->prepare("SELECT * FROM users WHERE username = :username LIMIT 1");
            $stmt->execute(['username' => $username]);
            $user = $stmt->fetch();

            if ($user && password_verify($password, $user['password'])) {
                $_SESSION['user_id'] = $user['id'];
                $_SESSION['username'] = $user['username'];
                $_SESSION['full_name'] = $user['full_name'];
                $_SESSION['email'] = $user['email'];

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
    <title>CYBER-LEGION | รับสมัครนักกีฬา Esports</title>
    <link href="https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@400;700&family=Orbitron:wght@400;900&display=swap" rel="stylesheet">
    <style>
        /* สไตล์ CSS ในไฟล์ประกอบไปด้วยธีม Cyberpunk ดำ-เทา-ฟ้านีออน-เขียวนีออน */
        /* (ดูรายละเอียดสไตล์เต็มในหน้าเว็บจริง) */
    </style>
</head>
<body>
    <!-- เนื้อหาหน้าเว็บ ฟอร์ม Login และ ลิงก์สมัครสมาชิก -->
</body>
</html>`
  },
  {
    name: 'register.php',
    language: 'php',
    description: 'หน้าฟอร์มลงทะเบียน: ตรวจสอบ Username ไม่ให้ซ้ำ, แฮชพาสเวิร์ด, และแสดงกล่องยืนยันข้อมูลไอดีและรหัสผ่านเมื่อสมัครสำเร็จ',
    code: `<?php
/**
 * register.php
 * หน้าลงทะเบียนนักกีฬาใหม่: รับข้อมูล ชื่อ-นามสกุล, อีเมล, กำหนด Username, Password
 */

session_start();
require_once 'db.php';

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
            $stmt = $pdo->prepare("SELECT id FROM users WHERE username = :username LIMIT 1");
            $stmt->execute(['username' => $username]);
            
            if ($stmt->fetch()) {
                $error_message = 'ชื่อผู้ใช้ (Username) นี้ถูกใช้งานแล้วในระบบ!';
            } else {
                $hashed_password = password_hash($password, PASSWORD_DEFAULT);

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

                $success_register = true;
                $registered_username = htmlspecialchars($username);
                $registered_password = htmlspecialchars($password);
            }
        } catch (PDOException $e) {
            $error_message = 'เกิดข้อผิดพลาดในการลงทะเบียน: ' . $e->getMessage();
        }
    } else {
        $error_message = 'กรุณากรอกข้อมูลให้ครบถ้วน!';
    }
}
?>
<!-- ส่วนโครงสร้าง HTML แสดงฟอร์มและกล่องความสำเร็จเมื่อ $success_register = true -->`
  },
  {
    name: 'game.php',
    language: 'php',
    description: 'หน้าทดสอบฝีมือ: คัดกรองการล็อกอิน, เชื่อมกล้องเว็บแคมผ่าน MediaPipe Hands, ตรวจจับปลายนิ้วชี้เพื่อจับดวงดาว และอัปโหลดผลสถิติด้วย Fetch API',
    code: `<?php
/**
 * game.php
 * หน้าทดสอบฝีมือ: ระบบทดสอบการจับภาพมือด้วยกล้องเว็บแคม (MediaPipe Hands Tracking)
 */

session_start();
require_once 'db.php';

if (!isset($_SESSION['user_id'])) {
    header("Location: index.php");
    exit();
}

$user_id = $_SESSION['user_id'];
// ดึงข้อมูลและคะแนนสูงสุดล่าสุดมาแสดง
$stmt = $pdo->prepare("SELECT full_name, high_score FROM users WHERE id = :id LIMIT 1");
$stmt->execute(['id' => $user_id]);
$user = $stmt->fetch();

$player_name = htmlspecialchars($user['full_name']);
$high_score = intval($user['high_score']);
?>
<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <title>CYBER-LEGION | AR HAND ASSESSMENT</title>
    <!-- นำเข้า MediaPipe CDNs -->
    <script src="https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js" crossorigin="anonymous"></script>
    <script src="https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js" crossorigin="anonymous"></script>
</head>
<body>
    <!-- โครงวาด Canvas, แถบ HUD แสดงคะแนนและเวลา, และเขียนสคริปต์ JavaScript ประมวลผลมือ -->
</body>
</html>`
  },
  {
    name: 'update_score.php',
    language: 'php',
    description: 'หน้าหลังบ้านรับข้อมูลแบบ JSON (AJAX): เช็คสถานะเซสชัน, ดึงข้อมูลคะแนนปัจจุบัน, และบันทึกคะแนนสูงสุดใหม่หากผู้เล่นทำลายสถิติเดิมได้',
    code: `<?php
/**
 * update_score.php
 * ไฟล์รับข้อมูลคะแนนด้วย AJAX (Fetch API) ทางช่องทาง POST เพื่อเปรียบเทียบและอัปเดตคะแนนสูงสุด (High Score) ในฐานข้อมูล
 */

header('Content-Type: application/json; charset=utf-8');
session_start();
require_once 'db.php';

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['status' => 'error', 'message' => 'กรุณาล็อกอินก่อนทำการบันทึกคะแนน!']);
    exit();
}

$user_id = $_SESSION['user_id'];
$input_data = file_get_contents('php://input');
$data = json_decode($input_data, true);

$new_score = isset($data['score']) ? intval($data['score']) : (isset($_POST['score']) ? intval($_POST['score']) : null);

if ($new_score === null || $new_score < 0) {
    echo json_encode(['status' => 'error', 'message' => 'คะแนนที่ส่งมาไม่ถูกต้อง!']);
    exit();
}

try {
    $stmt = $pdo->prepare("SELECT high_score FROM users WHERE id = :id LIMIT 1");
    $stmt->execute(['id' => $user_id]);
    $user = $stmt->fetch();

    $current_high_score = intval($user['high_score']);
    $is_new_record = false;

    if ($new_score > $current_high_score) {
        $updateStmt = $pdo->prepare("UPDATE users SET high_score = :new_score WHERE id = :id");
        $updateStmt->execute(['new_score' => $new_score, 'id' => $user_id]);
        $current_high_score = $new_score;
        $is_new_record = true;
    }

    echo json_encode([
        'status' => 'success',
        'message' => $is_new_record ? 'บันทึกคะแนนสถิติใหม่สำเร็จ!' : 'บันทึกคะแนนเรียบร้อยแล้ว (ไม่ทำลายสถิติเดิม)',
        'high_score' => $current_high_score,
        'new_record' => $is_new_record
    ]);
} catch (PDOException $e) {
    echo json_encode(['status' => 'error', 'message' => 'เกิดความผิดพลาดในระบบฐานข้อมูล: ' . $e->getMessage()]);
}
?>`
  },
  {
    name: 'database.sql',
    language: 'sql',
    description: 'ไฟล์ฐานข้อมูล SQL: สร้างโครงสร้างตารางและฐานข้อมูล esports_db เพื่อนำเข้าไปรันบน phpMyAdmin',
    code: `-- SQL Script for Esports Player Recruitment Database
-- Can be imported directly into phpMyAdmin on XAMPP

CREATE DATABASE IF NOT EXISTS \`esports_db\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE \`esports_db\`;

CREATE TABLE IF NOT EXISTS \`users\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`username\` VARCHAR(50) NOT NULL UNIQUE,
  \`password\` VARCHAR(255) NOT NULL,
  \`full_name\` VARCHAR(100) NOT NULL,
  \`email\` VARCHAR(100) NOT NULL,
  \`high_score\` INT DEFAULT 0,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`
  }
];
