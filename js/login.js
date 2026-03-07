document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const loginMessageEl = document.getElementById('login-message');
    const submitBtn = document.getElementById('login-submit-btn');

    const FINALISTS = [
        { team: 'Pixel Nova', email: 'devjithkurup@gmail.com' },
        { team: 'Tech strikers', email: 'bhavesh25beit@student.mes.ac.in' },
        { team: 'Thunder Strike Alliance', email: 'alpharahul19@gmail.com' },
        { team: 'JARVIS', email: 'bhavyasoni707@gmail.com' },
        { team: '4Script', email: 'kaustubhb25comp@student.mes.ac.in' }
    ];

    function isFinalist(teamName, email) {
        var t = (teamName || '').trim().toLowerCase();
        var e = (email || '').trim().toLowerCase();
        return FINALISTS.some(function (f) {
            return f.team.toLowerCase() === t && f.email.toLowerCase() === e;
        });
    }

    if (!loginForm) return;

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const teamName = document.getElementById('login-team-name').value.trim();
        const leaderEmail = document.getElementById('login-leader-email').value.trim();

        if (!teamName || !leaderEmail) return;

        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span>AUTHENTICATING...</span><span class="btn-arrow">→</span>';
        if (loginMessageEl) loginMessageEl.style.display = 'none';

        if (isFinalist(teamName, leaderEmail)) {
            sessionStorage.setItem('teamName', teamName);
            sessionStorage.setItem('teamEmail', leaderEmail);
            if (loginMessageEl) {
                loginMessageEl.textContent = "Login successful! Redirecting to Stage 5...";
                loginMessageEl.style.color = '#14b25f';
                loginMessageEl.style.display = 'block';
            }
            submitBtn.innerHTML = '<span>REDIRECTING...</span><span class="btn-arrow">→</span>';
            setTimeout(() => {
                window.location.href = 'html/stagefive.html';
            }, 1500);
        } else {
            if (loginMessageEl) {
                loginMessageEl.textContent = "Access denied. Invalid credentials.";
                loginMessageEl.style.color = '#e53e3e';
                loginMessageEl.style.display = 'block';
            }
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<span>AUTHENTICATE</span><span class="btn-arrow">→</span>';
        }
    });
});
