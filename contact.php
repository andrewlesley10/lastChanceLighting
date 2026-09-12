<?php
declare(strict_types=1);

function is_ajax_request(): bool
{
    $xhr = $_SERVER['HTTP_X_REQUESTED_WITH'] ?? '';
    $accept = $_SERVER['HTTP_ACCEPT'] ?? '';

    return strcasecmp($xhr, 'XMLHttpRequest') === 0
        || str_contains($accept, 'application/json');
}

function respond(bool $success, string $message, int $code = 200): void
{
    if (is_ajax_request()) {
        http_response_code($code);
        header('Content-Type: application/json; charset=UTF-8');
        echo json_encode([
            'success' => $success,
            'message' => $message,
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $query = http_build_query([
        'status' => $success ? 'success' : 'error',
        'message' => $message,
    ]);
    header('Location: contact?' . $query);
    exit;
}

/**
 * Per-IP submission cap, kept in a small JSON file per address.
 *
 * Deliberately fails OPEN: if the temp directory isn't writable we let the
 * message through rather than blocking a real customer. The point is to stop
 * bulk automated posting, not to be an access control.
 */
function within_rate_limit(string $ip, int $max = 5, int $window = 3600): bool
{
    $dir = sys_get_temp_dir() . '/lcl_contact';
    if (!is_dir($dir) && !@mkdir($dir, 0700, true) && !is_dir($dir)) {
        return true;
    }

    $handle = @fopen($dir . '/' . hash('sha256', $ip) . '.json', 'c+');
    if ($handle === false) {
        return true;
    }

    @flock($handle, LOCK_EX);
    $now = time();
    $decoded = json_decode((string) stream_get_contents($handle), true);
    $hits = is_array($decoded)
        ? array_values(array_filter($decoded, static fn($t) => is_int($t) && $t > $now - $window))
        : [];

    $allowed = count($hits) < $max;
    if ($allowed) {
        $hits[] = $now;
    }

    rewind($handle);
    ftruncate($handle, 0);
    fwrite($handle, (string) json_encode($hits));
    @flock($handle, LOCK_UN);
    fclose($handle);

    return $allowed;
}

/** Collapse anything that could break out of a mail header. */
function header_safe(string $value): string
{
    return trim(preg_replace('/[\r\n\t]+/', ' ', $value) ?? '');
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    if (is_ajax_request()) {
        respond(false, 'Invalid request method.', 405);
    }
    header('Location: contact');
    exit;
}

/* Honeypot: a field hidden from people but not from most bots. Anything that
   fills it gets a success response — telling a bot it failed just teaches it
   to try again differently. */
if (trim($_POST['website'] ?? '') !== '') {
    respond(true, 'Thank you! Your message has been sent successfully.');
}

if (!within_rate_limit($_SERVER['REMOTE_ADDR'] ?? 'unknown')) {
    respond(false, 'Too many messages from this connection. Please try again later, or call us on 011 403 1131 (landline) or +94 70 707 1010.', 429);
}

$firstName = trim($_POST['firstName'] ?? '');
$lastName = trim($_POST['lastName'] ?? '');
$email = trim($_POST['email'] ?? '');
$phone = trim($_POST['phone'] ?? '');
$projectType = trim($_POST['projectType'] ?? '');
$message = trim($_POST['message'] ?? '');

/* Length caps, so a single POST can't drop a novel into the inbox. */
$limits = [
    'firstName' => 100, 'lastName' => 100, 'email' => 254,
    'phone' => 40, 'message' => 5000,
];

$errors = [];

if ($firstName === '') {
    $errors[] = 'First name is required.';
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $errors[] = 'A valid email address is required.';
}

/* The form offers exactly three values — anything else was not typed by a
   person using the page. */
if (!in_array($projectType, ['residential', 'commercial', 'project'], true)) {
    $errors[] = 'Please choose what you are interested in.';
}

if ($message === '') {
    $errors[] = 'Your message is required.';
}

foreach ($limits as $field => $max) {
    if (mb_strlen($$field) > $max) {
        $errors[] = 'One of your entries is too long — please shorten it.';
        break;
    }
}

if (!empty($errors)) {
    respond(false, implode(' ', $errors), 422);
}

$to = 'info@lastchancelighting.lk';
/* Modern PHP already collapses CRLF in the subject, but don't rely on the
   host's PHP version for that — strip it here too. */
$subject = 'New contact form submission from ' . header_safe($firstName);

$body = "First Name: $firstName\n";
if ($lastName !== '') {
    $body .= "Last Name: $lastName\n";
}
$body .= "Email: $email\n";
if ($phone !== '') {
    $body .= "Phone: $phone\n";
}
$body .= "Project Type: $projectType\n\n";
$body .= "Message:\n$message\n";

$headers = [];
$headers[] = 'From: no-reply@lastchancelighting.lk';
$headers[] = 'Reply-To: ' . header_safe($email);
$headers[] = 'Content-Type: text/plain; charset=UTF-8';

$sent = @mail($to, $subject, $body, implode("\r\n", $headers));

if ($sent) {
    respond(true, 'Thank you! Your message has been sent successfully.');
}

respond(
    false,
    'Your message could not be sent right now. Please try again later or email us at info@lastchancelighting.lk.',
    500
);
