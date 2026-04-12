const fs = require('fs');

const path = 'c:\\\\People plus network\\\\user-profile.html';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
    /<div class="profile-header">[\\s\\S]*?<img src=".*?" alt="Profile" class="profile-img">/,
    '<div class="profile-header position-relative">\\n' +
    '    <img src="default-avatar.png" alt="Profile" class="profile-img bg-white" id="profileDisplay">\\n' +
    '    <div class="mt-2 mb-3">\\n' +
    '        <label for="avatarUpload" class="btn btn-sm btn-light text-dark fw-bold" style="cursor: pointer;"><i class="fas fa-camera"></i> Change Photo</label>\\n' +
    '        <input type="file" id="avatarUpload" style="display: none;" accept="image/*" onchange="previewImage(event)">\\n' +
    '    </div>'
);

content = content.replace(
    /<\/form>\\s*<\/div>\\s*<\/div>\\s*<\/div>\\s*<\/div>/,
    '</form>\\n' +
    '            </div>\\n' +
    '            \\n' +
    '            <!-- Change Password -->\\n' +
    '            <div class="profile-card p-4 mt-4 mb-4">\\n' +
    '                <h5><i class="fas fa-lock"></i> Change Password</h5>\\n' +
    '                <form id="changePasswordForm">\\n' +
    '                    <div class="row">\\n' +
    '                        <div class="col-md-12 mb-3"><label>Current Password</label><input type="password" class="form-control" placeholder="Enter current password"></div>\\n' +
    '                        <div class="col-md-6 mb-3"><label>New Password</label><input type="password" class="form-control" placeholder="Enter new password"></div>\\n' +
    '                        <div class="col-md-6 mb-3"><label>Confirm New Password</label><input type="password" class="form-control" placeholder="Confirm new password"></div>\\n' +
    '                        <div class="col-12"><button type="submit" class="btn-update w-100" style="background: linear-gradient(135deg, #11998e, #38ef7d);"><i class="fas fa-key"></i> Update Password</button></div>\\n' +
    '                    </div>\\n' +
    '                </form>\\n' +
    '            </div>\\n' +
    '        </div>\\n' +
    '    </div>\\n' +
    '</div>\\n' +
    '\\n' +
    '<script>\\n' +
    '    function previewImage(event) {\\n' +
    '        if(event.target.files.length > 0) {\\n' +
    '            var src = URL.createObjectURL(event.target.files[0]);\\n' +
    '            var preview = document.getElementById("profileDisplay");\\n' +
    '            preview.src = src;\\n' +
    '            alert("Profile picture uploaded successfully!");\\n' +
    '        }\\n' +
    '    }\\n' +
    '    \\n' +
    '    document.getElementById("changePasswordForm")?.addEventListener("submit", function(e) {\\n' +
    '        e.preventDefault();\\n' +
    '        alert("Password Changed Successfully!");\\n' +
    '    });\\n' +
    '</script>'
);

fs.writeFileSync(path, content);
console.log('user-profile.html updated');
