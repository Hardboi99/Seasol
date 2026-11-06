<?php
/**
 * Seasol Maritime India Pvt. Ltd.
 * Production SMTP Mail Handler & Form Submission Controller
 */

// Headers for AJAX & JSON response
header('Content-Type: application/json; charset=UTF-8');
header('X-Content-Type-Options: nosniff');

// Allow CORS if needed
if (isset($_SERVER['HTTP_ORIGIN'])) {
    header("Access-Control-Allow-Origin: {$_SERVER['HTTP_ORIGIN']}");
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Allow-Methods: POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Accept, X-Requested-With');
}

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Method not allowed. Only POST is accepted.']);
    exit;
}

// Load .env file if available
$envFile = __DIR__ . '/.env';
if (file_exists($envFile)) {
    $envLines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($envLines as $line) {
        $line = trim($line);
        if ($line === '' || strpos($line, '#') === 0) continue;
        if (strpos($line, '=') !== false) {
            list($key, $val) = explode('=', $line, 2);
            $key = trim($key);
            $val = trim($val, " \t\n\r\0\x0B\"'");
            putenv("$key=$val");
            $_ENV[$key] = $val;
            $_SERVER[$key] = $val;
        }
    }
}

// SMTP & Mail Configuration
$toAddresses = array_filter(array_map('trim', explode(',', getenv('MAIL_TO_ADDRESS') ?: 'cs2@seasolmaritime.com')));
if ($cc = getenv('MAIL_CC_ADDRESS')) {
    $toAddresses[] = trim($cc);
}
$toAddresses = array_unique($toAddresses);

$smtpConfig = [
    'host'       => getenv('SMTP_HOST') ?: 'smtp.gmail.com',
    'port'       => (int)(getenv('SMTP_PORT') ?: 587),
    'encryption' => getenv('SMTP_ENCRYPTION') ?: 'tls',
    'username'   => getenv('SMTP_USERNAME') ?: 'namanshetty620@gmail.com',
    'password'   => getenv('SMTP_PASSWORD') ?: 'njrawgpodpnwhsgz',
    'from_email' => getenv('MAIL_FROM_ADDRESS') ?: 'namanshetty620@gmail.com',
    'from_name'  => getenv('MAIL_FROM_NAME') ?: 'Fincrest 360',
    'to_email'   => $toAddresses
];

// Receive and parse input (JSON or form-data)
$rawInput = file_get_contents('php://input');
$data = [];

if (!empty($rawInput)) {
    $jsonData = json_decode($rawInput, true);
    if (json_last_error() === JSON_ERROR_NONE && is_array($jsonData)) {
        $data = $jsonData;
    }
}

if (empty($data) && !empty($_POST)) {
    $data = $_POST;
}

// Sanitize helper
function clean_input($val) {
    if (is_array($val)) return array_map('clean_input', $val);
    return htmlspecialchars(trim((string)$val), ENT_QUOTES, 'UTF-8');
}

$sanitized = clean_input($data);

// Identify form type
$formType = $sanitized['form_type'] ?? '';
if (!$formType) {
    if (isset($sanitized['origin']) && isset($sanitized['destination'])) {
        $formType = isset($sanitized['cargo']) ? 'route_enquiry' : 'quote_calculation';
    } elseif (isset($sanitized['consent'])) {
        $formType = 'contact_form';
    } else {
        $formType = 'general_enquiry';
    }
}

// Extract common fields
$name    = $sanitized['name'] ?? $sanitized['your_name'] ?? 'Website Visitor';
$email   = $sanitized['email'] ?? $sanitized['email_address'] ?? '';
$phone   = $sanitized['phone'] ?? $sanitized['phone_number'] ?? 'Not provided';
$company = $sanitized['company'] ?? $sanitized['enquiry_type'] ?? 'Not provided';
$service = $sanitized['service'] ?? $sanitized['service_type'] ?? 'General Enquiry';
$subject = $sanitized['subject'] ?? '';
$message = $sanitized['message'] ?? '';

// Specific fields for calculations/routes
$origin      = $sanitized['origin'] ?? '';
$destination = $sanitized['destination'] ?? '';
$cargo       = $sanitized['cargo'] ?? '';
$weight      = $sanitized['weight'] ?? '';
$dimensions  = trim(($sanitized['length'] ?? '') . ' x ' . ($sanitized['width'] ?? '') . ' x ' . ($sanitized['height'] ?? ''), ' x');

// Validation
if ($formType === 'contact_form') {
    if (empty($name) || empty($email) || empty($message)) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Please provide your name, business email, and message.']);
        exit;
    }
} elseif ($formType === 'quote_calculation') {
    if (empty($name) || empty($email)) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Please provide your name and email address.']);
        exit;
    }
} elseif ($formType === 'route_enquiry') {
    if (empty($origin) || empty($destination)) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Please specify origin and destination.']);
        exit;
    }
}

if (!empty($email) && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Please provide a valid email address.']);
    exit;
}

if (empty($subject)) {
    if ($formType === 'quote_calculation') {
        $subject = "Freight Calculation & Quote Enquiry from $name";
    } elseif ($formType === 'route_enquiry') {
        $subject = "Route Enquiry: $origin to $destination";
    } else {
        $subject = "New Inquiry from $name (" . ($service ?: 'Seasol Maritime') . ")";
    }
}

// Build Email Content
$dateStr = date('d M Y, h:i A T');

$emailHtml = '
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; background: #f4f7fb; color: #1e293b; margin: 0; padding: 20px; }
  .box { max-width: 620px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 14px rgba(0,0,0,0.06); }
  .head { background: linear-gradient(135deg, #0757E8 0%, #0A3FB8 100%); color: #ffffff; padding: 24px 28px; }
  .head h1 { margin: 0 0 6px 0; font-size: 20px; font-weight: 700; }
  .head p { margin: 0; opacity: 0.9; font-size: 13px; }
  .content { padding: 26px 28px; }
  .table { width: 100%; border-collapse: collapse; margin-bottom: 22px; font-size: 14px; }
  .table td { padding: 10px 12px; border-bottom: 1px solid #edf2f7; }
  .table td.lbl { width: 35%; font-weight: 600; color: #64748b; background: #f8fafc; }
  .msg-box { background: #f8fafc; border-left: 4px solid #0757E8; padding: 16px 18px; border-radius: 4px; font-size: 14px; line-height: 1.6; color: #334155; }
  .foot { background: #f8fafc; padding: 16px 28px; font-size: 12px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; }
</style>
</head>
<body>
<div class="box">
  <div class="head">
    <h1>Seasol Maritime - New Enquiry</h1>
    <p>' . htmlspecialchars($subject) . ' &bull; ' . $dateStr . '</p>
  </div>
  <div class="content">
    <table class="table">
      <tr><td class="lbl">Full Name</td><td><strong>' . htmlspecialchars($name) . '</strong></td></tr>
      <tr><td class="lbl">Email Address</td><td><a href="mailto:' . htmlspecialchars($email) . '">' . htmlspecialchars($email) . '</a></td></tr>
      <tr><td class="lbl">Phone Number</td><td>' . htmlspecialchars($phone) . '</td></tr>
      <tr><td class="lbl">Company / Entity</td><td>' . htmlspecialchars($company) . '</td></tr>
      <tr><td class="lbl">Service Required</td><td>' . htmlspecialchars($service) . '</td></tr>';

if ($origin) {
    $emailHtml .= '<tr><td class="lbl">Origin</td><td>' . htmlspecialchars($origin) . '</td></tr>';
}
if ($destination) {
    $emailHtml .= '<tr><td class="lbl">Destination</td><td>' . htmlspecialchars($destination) . '</td></tr>';
}
if ($cargo) {
    $emailHtml .= '<tr><td class="lbl">Cargo Type</td><td>' . htmlspecialchars($cargo) . '</td></tr>';
}
if ($weight) {
    $emailHtml .= '<tr><td class="lbl">Weight</td><td>' . htmlspecialchars($weight) . '</td></tr>';
}
if ($dimensions && $dimensions !== 'x  x') {
    $emailHtml .= '<tr><td class="lbl">Dimensions (LxWxH)</td><td>' . htmlspecialchars($dimensions) . '</td></tr>';
}

$emailHtml .= '
    </table>';

if (!empty($message)) {
    $emailHtml .= '
    <div style="font-weight: 600; font-size: 13px; color: #64748b; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.05em;">Message / Details:</div>
    <div class="msg-box">' . nl2br(htmlspecialchars($message)) . '</div>';
}

$emailHtml .= '
  </div>
  <div class="foot">
    Delivered via Seasol Maritime Website Portal &bull; Recipient: cs2@seasolmaritime.com
  </div>
</div>
</body>
</html>';

$emailText = "Seasol Maritime - New Website Enquiry\n"
           . "Subject: $subject\n"
           . "Date: $dateStr\n\n"
           . "Name: $name\n"
           . "Email: $email\n"
           . "Phone: $phone\n"
           . "Company: $company\n"
           . "Service: $service\n";

if ($origin) $emailText .= "Origin: $origin\n";
if ($destination) $emailText .= "Destination: $destination\n";
if ($cargo) $emailText .= "Cargo: $cargo\n";
if ($weight) $emailText .= "Weight: $weight\n";
if ($dimensions && $dimensions !== 'x  x') $emailText .= "Dimensions: $dimensions\n";
if ($message) $emailText .= "\nMessage:\n$message\n";

// SMTP Client Class
class SimpleSMTP {
    private $host;
    private $port;
    private $user;
    private $pass;
    private $from;
    private $fromName;
    private $socket;
    public $debug = [];

    public function __construct($host, $port, $user, $pass, $from, $fromName) {
        $this->host = $host;
        $this->port = $port;
        $this->user = $user;
        $this->pass = $pass;
        $this->from = $from;
        $this->fromName = $fromName;
    }

    private function getResponse() {
        $data = '';
        while (!feof($this->socket)) {
            $str = fgets($this->socket, 515);
            $data .= $str;
            if (substr($str, 3, 1) === ' ') break;
        }
        return $data;
    }

    private function sendCommand($cmd) {
        fputs($this->socket, $cmd . "\r\n");
        return $this->getResponse();
    }

    public function send($to, $subject, $bodyHtml, $bodyText = '', $replyTo = null) {
        $context = stream_context_create([
            'ssl' => [
                'verify_peer' => false,
                'verify_peer_name' => false,
                'allow_self_signed' => true
            ]
        ]);

        $this->socket = stream_socket_client(
            "tcp://{$this->host}:{$this->port}",
            $errno,
            $errstr,
            25,
            STREAM_CLIENT_CONNECT,
            $context
        );

        if (!$this->socket) {
            throw new Exception("SMTP Connection Failed: $errstr ($errno)");
        }

        $this->getResponse();
        $this->sendCommand("EHLO " . gethostname());

        $res = $this->sendCommand("STARTTLS");
        if (substr($res, 0, 3) !== '220') {
            throw new Exception("STARTTLS failed: $res");
        }

        if (!stream_socket_enable_crypto($this->socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) {
            throw new Exception("TLS encryption handshake failed");
        }

        $this->sendCommand("EHLO " . gethostname());

        $res = $this->sendCommand("AUTH LOGIN");
        if (substr($res, 0, 3) !== '334') throw new Exception("AUTH LOGIN failed: $res");

        $res = $this->sendCommand(base64_encode($this->user));
        if (substr($res, 0, 3) !== '334') throw new Exception("Username rejected: $res");

        $res = $this->sendCommand(base64_encode($this->pass));
        if (substr($res, 0, 3) !== '235') throw new Exception("Password rejected: $res");

        $res = $this->sendCommand("MAIL FROM:<{$this->from}>");
        if (substr($res, 0, 3) !== '250') throw new Exception("MAIL FROM rejected: $res");

        $recipients = is_array($to) ? $to : array_map('trim', explode(',', $to));
        foreach ($recipients as $rcpt) {
            if ($rcpt) {
                $res = $this->sendCommand("RCPT TO:<{$rcpt}>");
                if (substr($res, 0, 3) !== '250') throw new Exception("RCPT TO <{$rcpt}> rejected: $res");
            }
        }

        $res = $this->sendCommand("DATA");
        if (substr($res, 0, 3) !== '354') throw new Exception("DATA rejected: $res");

        $boundary = "----=_Part_" . md5(uniqid(time()));
        $headers = [
            "MIME-Version: 1.0",
            "From: =?UTF-8?B?" . base64_encode($this->fromName) . "?= <{$this->from}>",
            "To: " . implode(', ', $recipients),
            "Subject: =?UTF-8?B?" . base64_encode($subject) . "?=",
            "Date: " . date('r'),
            "Message-ID: <" . md5(uniqid(time())) . "@{$this->host}>",
            "Content-Type: multipart/alternative; boundary=\"$boundary\""
        ];

        if ($replyTo) {
            $headers[] = "Reply-To: <$replyTo>";
        }

        $msgBody = implode("\r\n", $headers) . "\r\n\r\n";

        if ($bodyText) {
            $msgBody .= "--$boundary\r\n";
            $msgBody .= "Content-Type: text/plain; charset=UTF-8\r\n";
            $msgBody .= "Content-Transfer-Encoding: 8bit\r\n\r\n";
            $msgBody .= $bodyText . "\r\n\r\n";
        }

        $msgBody .= "--$boundary\r\n";
        $msgBody .= "Content-Type: text/html; charset=UTF-8\r\n";
        $msgBody .= "Content-Transfer-Encoding: 8bit\r\n\r\n";
        $msgBody .= $bodyHtml . "\r\n\r\n";
        $msgBody .= "--$boundary--\r\n";

        $res = $this->sendCommand($msgBody . ".");
        if (substr($res, 0, 3) !== '250') throw new Exception("Failed to send DATA: $res");

        $this->sendCommand("QUIT");
        fclose($this->socket);
        return true;
    }
}

// Send email
try {
    $smtp = new SimpleSMTP(
        $smtpConfig['host'],
        $smtpConfig['port'],
        $smtpConfig['username'],
        $smtpConfig['password'],
        $smtpConfig['from_email'],
        $smtpConfig['from_name']
    );

    // Send notification to Seasol team (cs2@seasolmaritime.com + namanshetty620@gmail.com)
    $smtp->send(
        $smtpConfig['to_email'],
        $subject,
        $emailHtml,
        $emailText,
        $email ?: null
    );

    // If customer provided an email, send an auto-acknowledgement
    if (!empty($email)) {
        try {
            $ackSubject = "We have received your enquiry - Seasol Maritime India";
            $ackHtml = '
            <!DOCTYPE html><html><body style="font-family:Arial,sans-serif;line-height:1.6;color:#222;padding:20px;">
              <h2 style="color:#0757E8;">Thank you for contacting Seasol Maritime India</h2>
              <p>Dear ' . htmlspecialchars($name) . ',</p>
              <p>We have successfully received your inquiry regarding <strong>' . htmlspecialchars($service) . '</strong>.</p>
              <p>Our dedicated freight forwarding and commercial operations team will review your specifications and contact you shortly with a customized solution.</p>
              <br>
              <p>Warm regards,<br>
              <strong>Seasol Maritime India Pvt. Ltd.</strong><br>
              Email: <a href="mailto:cs2@seasolmaritime.com">cs2@seasolmaritime.com</a><br>
              Tel: +91 98982 86205<br>
              Web: <a href="http://seasolmaritime.com">www.seasolmaritime.com</a></p>
            </body></html>';
            
            $ackText = "Thank you for contacting Seasol Maritime India.\n\n"
                     . "Dear $name,\n\nWe have received your inquiry regarding $service. Our team will contact you shortly.\n\n"
                     . "Best regards,\nSeasol Maritime India Pvt. Ltd.\ncs2@seasolmaritime.com | +91 98982 86205";
            
            $smtpCustomer = new SimpleSMTP(
                $smtpConfig['host'],
                $smtpConfig['port'],
                $smtpConfig['username'],
                $smtpConfig['password'],
                $smtpConfig['from_email'],
                $smtpConfig['from_name']
            );
            $smtpCustomer->send($email, $ackSubject, $ackHtml, $ackText, 'cs2@seasolmaritime.com');
        } catch (Exception $ackEx) {
            // Non-blocking if customer confirmation fails
        }
    }

    echo json_encode([
        'status'  => 'success',
        'message' => 'Thank you! Your inquiry has been sent successfully. Our team will get back to you shortly.'
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status'  => 'error',
        'message' => 'Failed to send inquiry: ' . $e->getMessage()
    ]);
}
