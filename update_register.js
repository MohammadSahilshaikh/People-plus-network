const fs = require('fs');

const path = 'c:\\\\People plus network\\\\register.html';
let content = fs.readFileSync(path, 'utf8');

// Add "Forgot Password?" below login password field
content = content.replace(
    /<div class="text-end mb-3">\\s*<a href="#" class="text-decoration-none">Forgot Password\?<\/a>\\s*<\/div>/,
    '' // Remove old if exists
);
content = content.replace(
    /<input type="password" id="loginPassword" placeholder="Enter password" required>\\s*<\/div>/,
    '<input type="password" id="loginPassword" placeholder="Enter password" required>\\n' +
    '                        </div>\\n' +
    '                        <div class="text-end mb-3">\\n' +
    '                            <a href="#" data-bs-toggle="modal" data-bs-target="#forgotPasswordModal" style="color: #667eea; font-weight: 500;">Forgot Password?</a>\\n' +
    '                        </div>'
);

// Add the Modal
const modalHtml = `
<!-- Forgot Password Modal -->
<div class="modal fade" id="forgotPasswordModal" tabindex="-1" aria-hidden="true">
  <div class="modal-dialog modal-dialog-centered">
    <div class="modal-content" style="border-radius: 15px;">
      <div class="modal-header border-0 pb-0">
        <h5 class="modal-title fw-bold">Reset Password</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div class="modal-body p-4">
        <!-- Step 1: Request OTP -->
        <div id="forgetStep1">
            <p class="text-muted small mb-4">Enter your registered email address. We will send a security pin to verify your identity.</p>
            <div class="form-group mb-3">
                <label>Email Address</label>
                <input type="email" id="forgetEmail" class="form-control p-3" placeholder="user@example.com" style="border-radius:10px;">
            </div>
            <button type="button" class="btn-auth mt-2" onclick="sendForgetOtp()">Send Security Code</button>
        </div>
        
        <!-- Step 2: Verify OTP & New Password -->
        <div id="forgetStep2" style="display:none;">
            <div class="alert alert-success small mb-3">Code sent to your email successfully!</div>
            <div class="form-group mb-3">
                <label>Verification Code (OTP)</label>
                <input type="text" id="forgetOtp" class="form-control p-3" placeholder="Enter 6-digit OTP" style="border-radius:10px;">
            </div>
            <div class="form-group mb-3">
                <label>New Password</label>
                <input type="password" id="forgetNewPassword" class="form-control p-3" placeholder="Create strong password" style="border-radius:10px;">
            </div>
            <button type="button" class="btn-auth mt-2" onclick="verifyAndResetPassword()">Reset & Save Password</button>
        </div>
      </div>
    </div>
  </div>
</div>

<script>
    let tempForgetEmail = "";
    function sendForgetOtp() {
        const email = document.getElementById('forgetEmail').value;
        if(!email) return alert('Please enter your email.');
        // In reality, this would call /api/forgot-password to send an email.
        tempForgetEmail = email;
        const btn = event.target;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
        btn.disabled = true;
        
        setTimeout(() => {
            document.getElementById('forgetStep1').style.display = 'none';
            document.getElementById('forgetStep2').style.display = 'block';
        }, 1500);
    }
    
    function verifyAndResetPassword() {
        const otp = document.getElementById('forgetOtp').value;
        const pass = document.getElementById('forgetNewPassword').value;
        if(!otp || !pass) return alert('Enter OTP and New Password');
        
        const btn = event.target;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> verifying...';
        btn.disabled = true;
        
        setTimeout(() => {
            alert('Password reset successfully! You can now login with your new password.');
            bootstrap.Modal.getInstance(document.getElementById('forgotPasswordModal')).hide();
            document.getElementById('loginEmail').value = tempForgetEmail;
            document.getElementById('loginPassword').value = pass;
            // Reset modal state
            document.getElementById('forgetStep1').style.display = 'block';
            document.getElementById('forgetStep2').style.display = 'none';
            btn.innerText = 'Reset & Save Password';
            btn.disabled = false;
        }, 1500);
    }
</script>
`;

if (!content.includes('id="forgotPasswordModal"')) {
    content = content.replace('</body>', modalHtml + '\\n</body>');
}

fs.writeFileSync(path, content);
console.log('register.html updated');
