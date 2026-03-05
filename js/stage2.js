/**
 * Stage 2: Jarvis Command Room
 * Handles Stage 2 briefing (stagetwo.html) and AI Knowledge Ingestion Core (website.html)
 * Backend: POST /round_2 (Team_Name, git_hub_link, hosted_link, files)
 * Requires: api-config.js, form-utils.js
 */
(function () {
    'use strict';

    var ROUND_2_ENDPOINT = (window.API_CONFIG && window.API_CONFIG.getUrl('round_2')) || 'http://127.0.0.1:8000/round_2';

    /**
     * Initializes the team badge display from sessionStorage.
     */
    function initTeamBadge() {
        var teamName = sessionStorage.getItem('teamName');
        var badge = document.getElementById('stagetwo-team-badge') || document.getElementById('website-team-badge');
        var displayEl = document.getElementById('display-team-name');

        if (teamName && badge && displayEl) {
            displayEl.textContent = teamName;
            badge.classList.remove('hidden');
            badge.classList.add('flex');
        }
    }

    /**
     * Validates uploads on website.html and shows feedback.
     */
    function initSubmitPrototype() {
        var btn = document.getElementById('submit-prototype-btn');
        var proceedBtn = document.getElementById('proceed-anyway-btn');
        var proceedWrap = document.getElementById('proceed-anyway-wrap');
        var feedback = document.getElementById('upload-feedback');
        var imageInput = document.getElementById('image-input');
        var webUrl = document.getElementById('web-url');
        var repoLink = document.getElementById('repo-link');
        var statusVisual = document.getElementById('status-visual');
        var statusNetwork = document.getElementById('status-network');
        var statusRepository = document.getElementById('status-repository');

        if (!btn) return;

        initRealTimeValidation();

        function showUploadStatus() {
            var hasImage = imageInput && imageInput.files && imageInput.files.length > 0;
            var hasWebUrl = webUrl && webUrl.value && webUrl.value.trim().length > 0;
            var hasRepo = repoLink && repoLink.value && repoLink.value.trim().length > 0;

            // Update status panel
            if (statusVisual) {
                statusVisual.textContent = hasImage ? 'UPLOADED' : 'PENDING';
                statusVisual.className = 'terminal-line text-xs tracking-wide ' + (hasImage ? 'text-ingest-green' : 'text-amber-500');
            }
            if (statusNetwork) {
                statusNetwork.textContent = hasWebUrl ? 'UPLOADED' : 'PENDING';
                statusNetwork.className = 'terminal-line text-xs tracking-wide ' + (hasWebUrl ? 'text-ingest-green' : 'text-amber-500');
            }
            if (statusRepository) {
                statusRepository.textContent = hasRepo ? 'UPLOADED' : 'PENDING';
                statusRepository.className = 'terminal-line text-xs tracking-wide ' + (hasRepo ? 'text-ingest-green' : 'text-amber-500');
            }

            // Show feedback message
            if (feedback) {
                feedback.classList.remove('hidden');
                var complete = [hasImage ? 'IMAGE' : null, hasWebUrl ? 'WEB_URL' : null, hasRepo ? 'REPO_LINK' : null].filter(Boolean);
                var pending = [!hasImage ? 'IMAGE_INPUT' : null, !hasWebUrl ? 'WEB_URL' : null, !hasRepo ? 'REPO_LINK' : null].filter(Boolean);

                var msg = '';
                if (complete.length > 0) {
                    msg += '<span class="text-ingest-green">UPLOADED: ' + complete.join(', ') + '</span>';
                }
                if (pending.length > 0) {
                    msg += (msg ? '<br/>' : '') + '<span class="text-amber-500">PENDING: ' + pending.join(', ') + '</span>';
                }
                feedback.innerHTML = msg;
                feedback.className = 'mb-3 p-4 rounded-lg border text-xs font-mono ' +
                    (pending.length === 0 ? 'border-ingest-green/50 bg-ingest-green/5' : 'border-amber-500/50 bg-amber-500/5');
            }

            return { hasImage: hasImage, hasWebUrl: hasWebUrl, hasRepo: hasRepo };
        }

        function initRealTimeValidation() {
            if (webUrl && window.FormUtils && window.UIUtils) {
                webUrl.addEventListener('blur', function () {
                    var val = this.value.trim();
                    if (val) {
                        var check = window.FormUtils.validateUrl(val, 'any');
                        window.UIUtils.setFieldValidation(this, check.valid, check.message);
                    } else {
                        window.UIUtils.setFieldValidation(this, true);
                    }
                });
                webUrl.addEventListener('input', function () {
                    if (this.value.trim()) {
                        var check = window.FormUtils.validateUrl(this.value.trim(), 'any');
                        window.UIUtils.setFieldValidation(this, check.valid, check.message);
                    }
                });
            }
            if (repoLink && window.FormUtils && window.UIUtils) {
                repoLink.addEventListener('blur', function () {
                    var val = this.value.trim();
                    if (val) {
                        var check = window.FormUtils.validateUrl(val, 'github');
                        window.UIUtils.setFieldValidation(this, check.valid, check.message);
                    } else {
                        window.UIUtils.setFieldValidation(this, true);
                    }
                });
                repoLink.addEventListener('input', function () {
                    if (this.value.trim()) {
                        var check = window.FormUtils.validateUrl(this.value.trim(), 'github');
                        window.UIUtils.setFieldValidation(this, check.valid, check.message);
                    }
                });
            }
            if (imageInput && window.FormUtils && window.UIUtils) {
                imageInput.addEventListener('change', function () {
                    var files = this.files;
                    if (files && files.length > 0) {
                        var fs = window.FormUtils.validateFileSize(files);
                        window.UIUtils.setFieldValidation(this, fs.valid, fs.message);
                    } else {
                        window.UIUtils.setFieldValidation(this, true);
                    }
                    updateImagePreview();
                });
            }
        }

        var previewObjectUrls = [];
        function updateImagePreview() {
            var preview = document.getElementById('image-preview');
            if (!preview) return;
            previewObjectUrls.forEach(function (u) { URL.revokeObjectURL(u); });
            previewObjectUrls = [];
            var files = imageInput && imageInput.files ? imageInput.files : [];
            preview.innerHTML = '';
            if (files.length === 0) {
                preview.classList.add('hidden');
                return;
            }
            preview.classList.remove('hidden');
            for (var i = 0; i < files.length; i++) {
                if (!files[i].type.startsWith('image/')) continue;
                var url = URL.createObjectURL(files[i]);
                previewObjectUrls.push(url);
                var wrap = document.createElement('div');
                wrap.className = 'relative flex flex-col items-center';
                var img = document.createElement('img');
                img.src = url;
                img.alt = files[i].name;
                img.className = 'w-20 h-20 object-cover rounded-md border border-white/20 hover:border-hologram/50 transition-all';
                img.title = files[i].name;
                wrap.appendChild(img);
                var label = document.createElement('span');
                label.className = 'mt-1 text-[10px] text-white/60 truncate max-w-[90px]';
                label.textContent = files[i].name;
                wrap.appendChild(label);
                preview.appendChild(wrap);
            }
        }

        btn.addEventListener('click', function () {
            if (stage2Timer && stage2Timer.getRemaining() <= 0) {
                if (window.UIUtils) {
                    window.UIUtils.showToast('Time is up. Submission disabled.', 'error', 3000);
                } else if (feedback) {
                    feedback.classList.remove('hidden');
                    feedback.innerHTML = '<span class="text-red-500">Time is up. Submission disabled.</span>';
                    feedback.className = 'mb-3 p-4 rounded-lg border border-red-500/50 bg-red-500/5 text-xs font-mono';
                }
                return;
            }

            var status = showUploadStatus();

            if (status.hasImage && status.hasWebUrl && status.hasRepo) {
                submitToBackend();
            } else if (proceedWrap) {
                proceedWrap.classList.remove('hidden');
            }
        });

        if (proceedBtn) {
            proceedBtn.addEventListener('click', function () {
                if (stage2Timer && stage2Timer.getRemaining() <= 0) {
                    if (feedback) {
                        feedback.classList.remove('hidden');
                        feedback.innerHTML = '<span class="text-red-500">Time is up. Submission disabled.</span>';
                        feedback.className = 'mb-3 p-4 rounded-lg border border-red-500/50 bg-red-500/5 text-xs font-mono';
                    }
                    return;
                }
                if (proceedWrap) {
                    proceedWrap.classList.add('hidden');
                }
            });
        }

        function submitToBackend() {
            var teamName = (window.FormUtils && window.FormUtils.getTeamName()) || (sessionStorage.getItem('teamName') || '').trim() || 'xyz';
            var hostedLink = webUrl ? webUrl.value.trim() : '';
            var gitHubLink = repoLink ? repoLink.value.trim() : '';
            var fileList = imageInput && imageInput.files ? imageInput.files : [];

            var urlCheck = window.FormUtils && window.FormUtils.validateUrl(hostedLink, 'any');
            if (hostedLink && urlCheck && !urlCheck.valid) {
                if (feedback) {
                    feedback.classList.remove('hidden');
                    feedback.innerHTML = '<span class="text-amber-500">' + urlCheck.message + '</span>';
                    feedback.className = 'mb-3 p-4 rounded-lg border border-amber-500/50 bg-amber-500/5 text-xs font-mono';
                }
                return;
            }
            urlCheck = window.FormUtils && window.FormUtils.validateUrl(gitHubLink, 'github');
            if (gitHubLink && urlCheck && !urlCheck.valid) {
                if (feedback) {
                    feedback.classList.remove('hidden');
                    feedback.innerHTML = '<span class="text-amber-500">' + urlCheck.message + '</span>';
                    feedback.className = 'mb-3 p-4 rounded-lg border border-amber-500/50 bg-amber-500/5 text-xs font-mono';
                }
                return;
            }
            if (fileList.length > 0 && window.FormUtils && window.FormUtils.validateFileSize) {
                var fs = window.FormUtils.validateFileSize(fileList);
                if (!fs.valid) {
                    if (feedback) {
                        feedback.classList.remove('hidden');
                        feedback.innerHTML = '<span class="text-amber-500">' + fs.message + '</span>';
                        feedback.className = 'mb-3 p-4 rounded-lg border border-amber-500/50 bg-amber-500/5 text-xs font-mono';
                    }
                    return;
                }
            }

            if (!teamName) {
                if (feedback) {
                    feedback.classList.remove('hidden');
                    feedback.innerHTML = '<span class="text-amber-500">Register first. No team name in session.</span>';
                    feedback.className = 'mb-3 p-4 rounded-lg border border-amber-500/50 bg-amber-500/5 text-xs font-mono';
                }
                return;
            }

            var formData = new FormData();
            formData.append('Team_Name', teamName);
            formData.append('git_hub_link', gitHubLink);
            formData.append('hosted_link', hostedLink);
            for (var i = 0; i < fileList.length; i++) {
                formData.append('files', fileList[i]);
            }

            var matrixLoader = null;
            if (window.UIUtils) {
                window.UIUtils.setButtonLoading(btn, true, 'TRANSMITTING…');
                matrixLoader = window.UIUtils.showMatrixLoader('TRANSMITTING');
            } else {
                btn.disabled = true;
                btn.innerHTML = '<span class="material-symbols-outlined text-base animate-pulse">hourglass_empty</span><span>TRANSMITTING…</span>';
            }
            if (!window.UIUtils && feedback) {
                feedback.classList.remove('hidden');
                feedback.innerHTML = '<span class="text-hologram">Transmitting to backend…</span>';
                feedback.className = 'mb-3 p-4 rounded-lg border border-hologram/30 bg-black/50 text-xs font-mono';
            }

            fetch(ROUND_2_ENDPOINT, {
                method: 'POST',
                body: formData
            })
                .then(function (res) { return res.json().then(function (data) { return { ok: res.ok, status: res.status, data: data }; }); })
                .then(function (result) {
                    if (matrixLoader) matrixLoader.remove();
                    if (result.ok) {
                        var successMsg = 'Submitted successfully.' + (result.data.urls && result.data.urls.length ? ' ' + result.data.urls.length + ' file(s) uploaded.' : '');
                        if (window.UIUtils) {
                            window.UIUtils.showToast(successMsg, 'success', 2000);
                            window.UIUtils.setButtonLoading(btn, false);
                        } else if (feedback) {
                            feedback.innerHTML = '<span class="text-ingest-green">' + successMsg + '</span>';
                            feedback.className = 'mb-3 p-4 rounded-lg border border-ingest-green/50 bg-ingest-green/5 text-xs font-mono';
                        }
                        if (stage2Timer) stage2Timer.stop();
                    } else {
                        var msg = (window.FormUtils && window.FormUtils.parseApiError(result.data, result.status)) || 'Submission failed: ' + result.status;
                        if (window.UIUtils) {
                            window.UIUtils.showToast(msg, 'error', 4000);
                            window.UIUtils.setButtonLoading(btn, false);
                        } else {
                            if (feedback) {
                                feedback.innerHTML = '<span class="text-red-400">' + msg + '</span>';
                                feedback.className = 'mb-3 p-4 rounded-lg border border-red-500/50 bg-red-500/5 text-xs font-mono';
                            }
                            btn.disabled = false;
                            btn.innerHTML = '<span class="material-symbols-outlined text-base group-hover:translate-x-1 transition-transform">send</span><span class="tracking-wide">SUBMIT THE PROTOTYPE</span>';
                        }
                    }
                })
                .catch(function (err) {
                    if (matrixLoader) matrixLoader.remove();
                    var errMsg = 'Network error: ' + (err.message || 'Could not reach server.');
                    if (window.UIUtils) {
                        window.UIUtils.showToast(errMsg, 'error', 4000);
                        window.UIUtils.setButtonLoading(btn, false);
                    } else {
                        if (feedback) {
                            feedback.innerHTML = '<span class="text-red-400">' + errMsg + '</span>';
                            feedback.className = 'mb-3 p-4 rounded-lg border border-red-500/50 bg-red-500/5 text-xs font-mono';
                        }
                        btn.disabled = false;
                        btn.innerHTML = '<span class="material-symbols-outlined text-base group-hover:translate-x-1 transition-transform">send</span><span class="tracking-wide">SUBMIT THE PROTOTYPE</span>';
                    }
                });
        }
    }

    var stage2Timer = null;

    function initTimer() {
        var timerWrap = document.getElementById('stage2-timer');
        var timerDisplay = document.getElementById('stage2-timer-display');
        var submitBtn = document.getElementById('submit-prototype-btn');
        var proceedBtn = document.getElementById('proceed-anyway-btn');

        if (!timerWrap || !timerDisplay) return;

        timerWrap.classList.remove('hidden');
        timerWrap.classList.add('flex');

        stage2Timer = window.TimerUtils.init('STAGE_2_DURATION', timerDisplay, function () {
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.classList.add('opacity-50', 'cursor-not-allowed');
            }
            if (proceedBtn) {
                proceedBtn.disabled = true;
                proceedBtn.classList.add('opacity-50', 'cursor-not-allowed');
            }
            var feedback = document.getElementById('upload-feedback');
            if (feedback) {
                feedback.classList.remove('hidden');
                feedback.innerHTML = '<span class="text-red-500">Time is up. Submission disabled.</span>';
                feedback.className = 'mb-3 p-4 rounded-lg border border-red-500/50 bg-red-500/5 text-xs font-mono';
            }
        }, 'gdg_stage2_start');

        stage2Timer.start();
    }

    document.addEventListener('DOMContentLoaded', function () {
        initTeamBadge();
        initSubmitPrototype();
        if (window.TimerUtils) {
            initTimer();
        }
        setTimeout(function () {
            var submitPrototype = document.getElementById('submit-prototype-btn');
            if (submitPrototype) {
                var initFunc = submitPrototype.getAttribute('data-init-validation');
                if (!initFunc) {
                    submitPrototype.setAttribute('data-init-validation', 'true');
                    var btn = document.getElementById('submit-prototype-btn');
                    var webUrl = document.getElementById('web-url');
                    var repoLink = document.getElementById('repo-link');
                    var imageInput = document.getElementById('image-input');
                    if (webUrl || repoLink || imageInput) {
                        if (webUrl && window.FormUtils && window.UIUtils) {
                            webUrl.addEventListener('blur', function () {
                                var val = this.value.trim();
                                if (val) {
                                    var check = window.FormUtils.validateUrl(val, 'any');
                                    window.UIUtils.setFieldValidation(this, check.valid, check.message);
                                } else {
                                    window.UIUtils.setFieldValidation(this, true);
                                }
                            });
                        }
                        if (repoLink && window.FormUtils && window.UIUtils) {
                            repoLink.addEventListener('blur', function () {
                                var val = this.value.trim();
                                if (val) {
                                    var check = window.FormUtils.validateUrl(val, 'github');
                                    window.UIUtils.setFieldValidation(this, check.valid, check.message);
                                } else {
                                    window.UIUtils.setFieldValidation(this, true);
                                }
                            });
                        }
                        if (imageInput && window.FormUtils && window.UIUtils) {
                            imageInput.addEventListener('change', function () {
                                var files = this.files;
                                if (files && files.length > 0) {
                                    var fs = window.FormUtils.validateFileSize(files);
                                    window.UIUtils.setFieldValidation(this, fs.valid, fs.message);
                                } else {
                                    window.UIUtils.setFieldValidation(this, true);
                                }
                            });
                        }
                    }
                }
            }
        }, 100);
    });
})();
