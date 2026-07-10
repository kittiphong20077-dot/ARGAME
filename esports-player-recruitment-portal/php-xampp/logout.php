<?php
/**
 * logout.php
 * ไฟล์ระบบสำหรับออกจากระบบและทำลายข้อมูล Session
 */

session_start();

// ล้างตัวแปร Session ทั้งหมด
$_SESSION = array();

// ทำลาย Session คุกกี้ในเบราว์เซอร์
if (ini_get("session.use_cookies")) {
    $params = session_get_cookie_params();
    setcookie(session_name(), '', time() - 42000,
        $params["path"], $params["domain"],
        $params["secure"], $params["httponly"]
    );
}

// ทำลายเซสชัน
session_destroy();

// ส่งผู้ใช้กลับหน้าล็อกอินหลัก
header("Location: index.php");
exit();
?>
