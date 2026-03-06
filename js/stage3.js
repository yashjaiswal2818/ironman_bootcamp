/**
 * Stage 3: Mark UI Design Bay
 * Handles image upload (multiple), figma link, tactical rationale
 * Backend: POST /round_3 (FormData: Team_Name, figma_links, description, files)
 */
(function () {
    'use strict';

    var ROUND_3_ENDPOINT = (window.API_CONFIG && window.API_CONFIG.getUrl('round_3')) || 'https://gdg-ironman-participants-latest.onrender.com/round_3';
    var MAX_FILE_SIZE_MB = 10;
    var MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

    function getTeamName() {
        return (window.FormUtils && window.FormUtils.getTeamName()) || (sessionStorage.getItem('teamName') || '').trim() || 'xyz';
    }

    function getRound3SubmittedKey() {
        var team = getTeamName();
        return 'gdg_round3_submitted_' + (team || 'xyz');
    }

    function isRound3AlreadySubmitted() {
        return sessionStorage.getItem(getRound3SubmittedKey()) === 'true';
    }

    function setRound3Submitted() {
        sessionStorage.setItem(getRound3SubmittedKey(), 'true');
    }

    function applyAlreadySubmittedState(btn, feedbackEl) {
        if (btn) {
            btn.disabled = true;
            btn.classList.add('opacity-50', 'cursor-not-allowed');
            if (window.UIUtils) window.UIUtils.setButtonLoading(btn, false);
            btn.innerHTML = '<span class="material-symbols-outlined !text-[16px]">check_circle</span><span class="font-bold text-xs tracking-widest">ALREADY SUBMITTED</span>';
        }
        if (feedbackEl) {
            feedbackEl.textContent = 'This team has already submitted. Only one submission per group.';
            feedbackEl.classList.remove('hidden');
            feedbackEl.className = 'text-xs font-mono text-emerald-400';
        }
    }

    function redirectToStageFour() {
        setTimeout(function () {
            window.location.href = 'stagefour.html';
        }, 1500);
    }

    function initUpload() {
        var fileInput = document.getElementById('interface-schematics');
        var uploadArea = document.getElementById('upload-area');
        var previewWrap = document.getElementById('stage3-preview-wrap');
        var previewContainer = document.getElementById('stage3-preview');
        var labelEl = document.getElementById('upload-area-label');

        if (!fileInput || !uploadArea) return;

        // Click on upload area -> trigger file input
        uploadArea.addEventListener('click', function (e) {
            e.preventDefault();
            fileInput.click();
        });

        // Prevent default drag behaviors
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(function (evt) {
            uploadArea.addEventListener(evt, function (e) {
                e.preventDefault();
                e.stopPropagation();
            });
        });

        ['dragenter', 'dragover'].forEach(function (evt) {
            uploadArea.addEventListener(evt, function () {
                uploadArea.classList.add('ui-drag-over');
            });
        });

        ['dragleave', 'drop'].forEach(function (evt) {
            uploadArea.addEventListener(evt, function () {
                uploadArea.classList.remove('ui-drag-over');
            });
        });

        uploadArea.addEventListener('drop', function (e) {
            var files = e.dataTransfer.files;
            if (files && files.length) {
                handleFiles(files, fileInput, previewWrap, previewContainer, labelEl);
            }
        });

        fileInput.addEventListener('change', function () {
            var files = this.files;
            if (files && files.length) {
                handleFiles(files, fileInput, previewWrap, previewContainer, labelEl);
            }
        });
    }

    function handleFiles(files, fileInput, previewWrap, previewContainer, labelEl) {
        var dataTransfer = new DataTransfer();
        var existingNames = {};
        for (var i = 0; i < fileInput.files.length; i++) {
            dataTransfer.items.add(fileInput.files[i]);
            existingNames[fileInput.files[i].name] = true;
        }
        for (var j = 0; j < files.length; j++) {
            var file = files[j];
            if (existingNames[file.name]) continue;
            if (!file.type.match(/^image\/(png|jpeg|jpg|webp)$/i)) {
                if (window.UIUtils) window.UIUtils.showToast('Skipped "' + file.name + '" - only PNG/JPG/WebP allowed.', 'warning', 3000);
                continue;
            }
            if (file.size > MAX_FILE_SIZE_BYTES) {
                if (window.UIUtils) window.UIUtils.showToast('Skipped "' + file.name + '" - exceeds 10MB limit.', 'warning', 3000);
                continue;
            }
            dataTransfer.items.add(file);
        }
        if (dataTransfer.files.length === 0) return;
        fileInput.files = dataTransfer.files;

        if (labelEl) {
            labelEl.textContent = dataTransfer.files.length + ' file(s) selected';
        }
        if (previewWrap) previewWrap.classList.remove('hidden');
        if (previewContainer) {
            previewContainer.innerHTML = '';
            for (var k = 0; k < fileInput.files.length; k++) {
                var file = fileInput.files[k];
                var reader = new FileReader();
                reader.onload = (function (f) {
                    return function (e) {
                        var div = document.createElement('div');
                        div.className = 'relative w-16 h-16 rounded overflow-hidden border border-white/10 flex-shrink-0';
                        var img = document.createElement('img');
                        img.src = e.target.result;
                        img.alt = f.name;
                        img.className = 'w-full h-full object-cover';
                        div.appendChild(img);
                        var removeBtn = document.createElement('button');
                        removeBtn.type = 'button';
                        removeBtn.className = 'absolute top-0 right-0 w-5 h-5 bg-red-500/80 hover:bg-red-500 rounded-bl text-white text-[10px] flex items-center justify-center';
                        removeBtn.innerHTML = '&times;';
                        removeBtn.onclick = function () {
                            removeFileByName(f.name, fileInput, previewWrap, previewContainer, labelEl);
                        };
                        div.appendChild(removeBtn);
                        previewContainer.appendChild(div);
                    };
                })(file);
                reader.readAsDataURL(file);
            }
        }
    }

    function removeFileByName(fileName, fileInput, previewWrap, previewContainer, labelEl) {
        var dt = new DataTransfer();
        var files = fileInput.files;
        for (var i = 0; i < files.length; i++) {
            if (files[i].name !== fileName) dt.items.add(files[i]);
        }
        fileInput.files = dt.files;
        rebuildPreview(fileInput, previewWrap, previewContainer, labelEl);
    }

    function rebuildPreview(fileInput, previewWrap, previewContainer, labelEl) {
        if (!previewContainer) return;
        previewContainer.innerHTML = '';
        var files = fileInput.files;
        if (files.length === 0) {
            if (previewWrap) previewWrap.classList.add('hidden');
            if (labelEl) labelEl.textContent = 'INITIATE UPLOAD (multiple images)';
            return;
        }
        if (labelEl) labelEl.textContent = files.length + ' file(s) selected';
        if (previewWrap) previewWrap.classList.remove('hidden');
        for (var i = 0; i < files.length; i++) {
            (function (file) {
                var reader = new FileReader();
                reader.onload = function (e) {
                    var div = document.createElement('div');
                    div.className = 'relative w-16 h-16 rounded overflow-hidden border border-white/10 flex-shrink-0';
                    var img = document.createElement('img');
                    img.src = e.target.result;
                    img.alt = file.name;
                    img.className = 'w-full h-full object-cover';
                    div.appendChild(img);
                    var removeBtn = document.createElement('button');
                    removeBtn.type = 'button';
                    removeBtn.className = 'absolute top-0 right-0 w-5 h-5 bg-red-500/80 hover:bg-red-500 rounded-bl text-white text-[10px] flex items-center justify-center';
                    removeBtn.innerHTML = '&times;';
                    removeBtn.onclick = function () {
                        removeFileByName(file.name, fileInput, previewWrap, previewContainer, labelEl);
                    };
                    div.appendChild(removeBtn);
                    previewContainer.appendChild(div);
                };
                reader.readAsDataURL(file);
            })(files[i]);
        }
    }

    function initSubmit() {
        var btn = document.getElementById('transmit-data-btn');
        var figmaInput = document.getElementById('figma-link');
        var rationaleInput = document.getElementById('tactical-rationale');
        var fileInput = document.getElementById('interface-schematics');
        var feedbackEl = document.getElementById('stage3-feedback');

        if (!btn) return;

        // On load: if this team already submitted, show already-submitted state
        if (isRound3AlreadySubmitted()) {
            applyAlreadySubmittedState(btn, feedbackEl);
            if (window.UIUtils) window.UIUtils.showToast('This team has already submitted. Only one submission per group.', 'info', 3000);
        }

        btn.addEventListener('click', function (e) {
            e.preventDefault();

            if (isRound3AlreadySubmitted()) {
                if (window.UIUtils) window.UIUtils.showToast('Already submitted. Redirecting…', 'info', 2000);
                else if (feedbackEl) {
                    feedbackEl.textContent = 'Already submitted. Redirecting…';
                    feedbackEl.classList.remove('hidden');
                    feedbackEl.className = 'text-xs font-mono text-emerald-400';
                }
                redirectToStageFour();
                return;
            }

            var teamName = getTeamName();
            var figmaLinks = figmaInput ? figmaInput.value.trim() : '';
            var description = rationaleInput ? rationaleInput.value.trim() : '';
            var files = fileInput ? fileInput.files : [];

            if (!files || files.length === 0) {
                var msg = 'Please upload at least one image.';
                if (window.UIUtils) window.UIUtils.showToast(msg, 'error', 3000);
                else if (feedbackEl) {
                    feedbackEl.textContent = msg;
                    feedbackEl.classList.remove('hidden');
                    feedbackEl.className = 'text-xs font-mono text-red-400';
                }
                return;
            }

            var formData = new FormData();
            formData.append('Team_Name', teamName);
            formData.append('figma_links', figmaLinks);
            formData.append('description', description);
            for (var i = 0; i < files.length; i++) {
                formData.append('files', files[i]);
            }

            if (window.UIUtils) {
                window.UIUtils.setButtonLoading(btn, true, 'TRANSMITTING…');
            } else {
                btn.disabled = true;
                btn.innerHTML = '<span class="material-symbols-outlined !text-[16px] animate-pulse">hourglass_empty</span><span class="font-bold text-xs tracking-widest">TRANSMITTING…</span>';
            }
            if (feedbackEl) {
                feedbackEl.classList.add('hidden');
            }

            fetch(ROUND_3_ENDPOINT, {
                method: 'POST',
                body: formData
            })
                .then(function (res) { return res.json().then(function (data) { return { ok: res.ok, status: res.status, data: data || {} }; }); })
                .then(function (result) {
                    var data = result.data || {};
                    if (window.UIUtils) window.UIUtils.setButtonLoading(btn, false);
                    else {
                        btn.disabled = false;
                        btn.innerHTML = '<span><span class="material-symbols-outlined !text-[16px]">send</span><span class="font-bold text-xs tracking-widest">TRANSMIT DATA</span></span>';
                    }

                    if (result.ok) {
                        var alreadySubmitted = data.already_submitted === true ||
                            (data.message && String(data.message).toLowerCase().indexOf('already submitted') !== -1);

                        if (alreadySubmitted) {
                            setRound3Submitted();
                            applyAlreadySubmittedState(btn, feedbackEl);
                            if (window.UIUtils) window.UIUtils.showToast('Already submitted. Only one submission per group.', 'info', 2000);
                            else if (feedbackEl) {
                                feedbackEl.textContent = 'Already submitted. Only one submission per group.';
                                feedbackEl.classList.remove('hidden');
                                feedbackEl.className = 'text-xs font-mono text-emerald-400';
                            }
                        } else {
                            setRound3Submitted();
                            if (window.UIUtils) window.UIUtils.showToast('Submitted successfully.', 'success', 2000);
                            if (feedbackEl) {
                                feedbackEl.textContent = 'Submitted successfully.';
                                feedbackEl.classList.remove('hidden');
                                feedbackEl.className = 'text-xs font-mono text-emerald-400';
                            }
                        }
                        redirectToStageFour();
                    } else {
                        var errMsg = (window.FormUtils && window.FormUtils.parseApiError(data, result.status)) || 'Submission failed: ' + result.status;
                        var isAlreadySubmittedError = result.status === 409 || (errMsg && String(errMsg).toLowerCase().indexOf('already submitted') !== -1);
                        if (isAlreadySubmittedError) {
                            setRound3Submitted();
                            applyAlreadySubmittedState(btn, feedbackEl);
                            if (window.UIUtils) window.UIUtils.showToast('Already submitted. Only one submission per group.', 'info', 2000);
                            else if (feedbackEl) {
                                feedbackEl.textContent = 'Already submitted. Only one submission per group.';
                                feedbackEl.classList.remove('hidden');
                                feedbackEl.className = 'text-xs font-mono text-emerald-400';
                            }
                            redirectToStageFour();
                        } else {
                            if (window.UIUtils) window.UIUtils.showToast(errMsg, 'error', 4000);
                            if (feedbackEl) {
                                feedbackEl.textContent = errMsg;
                                feedbackEl.classList.remove('hidden');
                                feedbackEl.className = 'text-xs font-mono text-red-400';
                            }
                        }
                    }
                })
                .catch(function (err) {
                    if (window.UIUtils) window.UIUtils.setButtonLoading(btn, false);
                    else {
                        btn.disabled = false;
                        btn.innerHTML = '<span><span class="material-symbols-outlined !text-[16px]">send</span><span class="font-bold text-xs tracking-widest">TRANSMIT DATA</span></span>';
                    }
                    var errMsg = 'Network error: ' + (err.message || 'Could not reach server.');
                    if (window.UIUtils) window.UIUtils.showToast(errMsg, 'error', 4000);
                    if (feedbackEl) {
                        feedbackEl.textContent = errMsg;
                        feedbackEl.classList.remove('hidden');
                        feedbackEl.className = 'text-xs font-mono text-red-400';
                    }
                });
        });
    }

    function initRationaleCount() {
        var textarea = document.getElementById('tactical-rationale');
        var countEl = document.getElementById('tactical-rationale-count');
        if (!textarea || !countEl) return;
        function update() {
            var len = textarea.value.length;
            countEl.textContent = len + '/500';
        }
        textarea.addEventListener('input', update);
        update();
    }

    document.addEventListener('DOMContentLoaded', function () {
        initUpload();
        initSubmit();
        initRationaleCount();
    });
})();
