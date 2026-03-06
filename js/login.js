document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const loginMessageEl = document.getElementById('login-message');
    const submitBtn = document.getElementById('login-submit-btn');

    if (!loginForm) return;

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const teamName = document.getElementById('login-team-name').value.trim();
        const leaderEmail = document.getElementById('login-leader-email').value.trim();

        if (!teamName || !leaderEmail) return;

        let loginSuccess = false;
        try {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span>AUTHENTICATING...</span><span class="btn-arrow">→</span>';
            if (loginMessageEl) loginMessageEl.style.display = 'none';

            // Check if endpoint is using Leader_Email or Loader_Email based on requirements
            const url = `https://gdg-ironman-participants-latest-1.onrender.com/login?Team_Name=${encodeURIComponent(teamName)}&Leader_Email=${encodeURIComponent(leaderEmail)}`;
            const fallbackUrl = `https://gdg-ironman-participants-latest-1.onrender.com/login?Team_Name=${encodeURIComponent(teamName)}&Loader_Email=${encodeURIComponent(leaderEmail)}`;

            let response = await fetch(fallbackUrl); // Using Loader_Email as per user url example, although Leader_Email was mentioned. It's safer to use the one from the provided URL.

            // If the above fails, let's try the logical one
            if (!response.ok) {
                response = await fetch(url);
            }

            if (!response.ok) {
                throw new Error("Network response was not ok");
            }

            const data = await response.json();

            if (data.flag === "Success") {
                loginSuccess = true;
                sessionStorage.setItem('teamName', data.Team_Name);
                if (leaderEmail) {
                    sessionStorage.setItem('teamEmail', leaderEmail);
                }
                if (loginMessageEl) {
                    loginMessageEl.textContent = "Login successful! Redirecting to Stage 3...";
                    loginMessageEl.style.color = '#14b25f';
                    loginMessageEl.style.display = 'block';
                }
                setTimeout(() => {
                    window.location.href = 'html/stagethree.html';
                }, 1500);
            } else {
                if (loginMessageEl) {
                    loginMessageEl.textContent = "Login failed. Name or email is wrong, please try again.";
                    loginMessageEl.style.color = '#e53e3e';
                    loginMessageEl.style.display = 'block';
                }
            }
        } catch (error) {
            console.error("Login Error:", error);
            if (loginMessageEl) {
                loginMessageEl.textContent = "Login failed. Name or email is wrong, please try again.";
                loginMessageEl.style.color = '#e53e3e';
                loginMessageEl.style.display = 'block';
            }
        } finally {
            if (!loginSuccess) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<span>AUTHENTICATE</span><span class="btn-arrow">→</span>';
            } else {
                submitBtn.innerHTML = '<span>REDIRECTING...</span><span class="btn-arrow">→</span>';
            }
        }
    });
});
