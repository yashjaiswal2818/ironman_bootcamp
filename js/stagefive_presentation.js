/**
 * Stage 5: Arc Reactor Pitch
 * Handles stagefive_presentation.html - Innovation Pitch submission
 * Backend: POST /round_5 (Team_Name, abstract, score_5, files)
 * Requires: api-config.js, form-utils.js
 */
(function () {
    'use strict';

    var ROUND_5_ENDPOINT = (window.API_CONFIG && window.API_CONFIG.getUrl('round_5')) || 'http://127.0.0.1:8000/round_5';
    var MAX_FILE_SIZE_MB = 8;
    var ALLOWED_TYPES = ['application/pdf', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'];
    var ALLOWED_EXTENSIONS = ['.pdf', '.pptx'];

    var formEl = document.getElementById('round5-form');
    var abstractEl = document.getElementById('round5-abstract');
    var filesInput = document.getElementById('round5-files');
    var filesLabel = document.getElementById('round5-files-label');
    var previewEl = document.getElementById('round5-preview');
    var submitBtn = document.getElementById('round5-submit-btn');
    var messageEl = document.getElementById('round5-message');

    var previewObjectUrls = [];

    function getTeamName() {
        return (window.FormUtils && window.FormUtils.getTeamName()) || (sessionStorage.getItem('teamName') || '').trim() || 'xyz';
    }

    function getRound5SubmittedKey() {
        var team = getTeamName();
        return 'gdg_round5_submitted_' + (team || 'xyz');
    }

    function isRound5AlreadySubmitted() {
        return sessionStorage.getItem(getRound5SubmittedKey()) === 'true';
    }

    function setRound5Submitted() {
        sessionStorage.setItem(getRound5SubmittedKey(), 'true');
    }

    function applyAlreadySubmittedState() {
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.classList.add('opacity-50', 'cursor-not-allowed');
            if (window.UIUtils) window.UIUtils.setButtonLoading(submitBtn, false);
            submitBtn.innerHTML = '<span class="material-symbols-outlined text-base md:text-lg">check_circle</span><span class="font-bold tracking-[0.15em] md:tracking-[0.2em] text-xs md:text-sm font-header uppercase">ALREADY SUBMITTED</span>';
        }
        if (filesInput) filesInput.disabled = true;
        if (abstractEl) abstractEl.disabled = true;
        showMessage('This team has already submitted. Only one submission per group.', true);
    }

    function redirectToMissionComplete() {
        setTimeout(function () {
            window.location.href = 'mission_complete.html';
        }, 1500);
    }

    function showMessage(text, isError) {
        if (!messageEl) return;
        messageEl.textContent = text;
        messageEl.classList.remove('hidden', 'text-stark-red', 'text-stark-blue');
        messageEl.classList.add(isError ? 'text-stark-red' : 'text-stark-blue');
    }

    function hideMessage() {
        if (messageEl) messageEl.classList.add('hidden');
    }

    function isAllowedFile(file) {
        var name = (file.name || '').toLowerCase();
        var ext = ALLOWED_EXTENSIONS.some(function (e) { return name.endsWith(e); });
        var type = file.type && ALLOWED_TYPES.indexOf(file.type) !== -1;
        return ext || type;
    }

    function validateStage5Files(files) {
        if (!files || files.length === 0) return { valid: true };
        var maxBytes = MAX_FILE_SIZE_MB * 1024 * 1024;
        for (var i = 0; i < files.length; i++) {
            var f = files[i];
            if (!isAllowedFile(f)) {
                return { valid: false, message: '"' + f.name + '" is not allowed. Only .PDF and .PPTX files are accepted.' };
            }
            if (f.size > maxBytes) {
                return { valid: false, message: '"' + f.name + '" exceeds ' + MAX_FILE_SIZE_MB + ' MB limit.' };
            }
        }
        return { valid: true };
    }

    function renderPreviews(files) {
        if (!previewEl) return;
        previewObjectUrls.forEach(function (url) { URL.revokeObjectURL(url); });
        previewObjectUrls = [];
        previewEl.innerHTML = '';
        previewEl.classList.add('hidden');
        if (!files || files.length === 0) return;

        previewEl.classList.remove('hidden');
        for (var i = 0; i < files.length; i++) {
            var file = files[i];
            var card = document.createElement('div');
            card.className = 'flex-shrink-0 rounded border border-[#C6A15B]/30 bg-black/40 overflow-hidden flex flex-col items-center justify-center p-3 w-24 md:w-28';
            var icon = document.createElement('span');
            icon.className = 'material-symbols-outlined text-[#C6A15B] text-2xl md:text-3xl mb-1';
            icon.textContent = 'description';
            card.appendChild(icon);
            var nameWrap = document.createElement('div');
            nameWrap.className = 'text-[9px] md:text-[10px] text-white/80 font-mono text-center truncate w-full px-1';
            nameWrap.title = file.name;
            nameWrap.textContent = file.name;
            card.appendChild(nameWrap);
            previewEl.appendChild(card);
        }
    }

    if (filesInput) {
        filesInput.addEventListener('change', function () {
            var rawFiles = this.files;
            if (!rawFiles || rawFiles.length === 0) {
                if (filesLabel) filesLabel.textContent = 'PORT READY';
                renderPreviews([]);
                return;
            }
            var validation = validateStage5Files(rawFiles);
            if (!validation.valid) {
                if (window.UIUtils) window.UIUtils.showToast(validation.message, 'error', 4000);
                else showMessage(validation.message, true);
                this.value = '';
                if (filesLabel) filesLabel.textContent = 'PORT READY';
                renderPreviews([]);
                return;
            }
            var count = rawFiles.length;
            if (filesLabel) filesLabel.textContent = count + ' FILE(S) SELECTED';
            renderPreviews(rawFiles);
        });
    }

    function handleSubmit(e) {
        if (e && e.preventDefault) e.preventDefault();

        (async function () {
            if (isRound5AlreadySubmitted()) {
                if (window.UIUtils) window.UIUtils.showToast('Already submitted. Redirecting…', 'info', 2000);
                else showMessage('Already submitted. Redirecting…', false);
                redirectToMissionComplete();
                return;
            }

            var teamName = getTeamName();
            var abstract = abstractEl ? (abstractEl.value || '').trim() : '';
            if (!abstract) {
                showMessage('Technical Abstract is required.', true);
                return;
            }
            var fileList = filesInput && filesInput.files ? filesInput.files : [];
            if (fileList.length === 0) {
                showMessage('Please upload at least one file (.PDF or .PPTX, max 8 MB each).', true);
                return;
            }
            var fileValidation = validateStage5Files(fileList);
            if (!fileValidation.valid) {
                showMessage(fileValidation.message, true);
                return;
            }

            var formData = new FormData();
            formData.append('Team_Name', teamName);
            formData.append('abstract', abstract);
            formData.append('score_5', '0');
            for (var i = 0; i < fileList.length; i++) {
                formData.append('files', fileList[i]);
            }

            var matrixLoader = null;
            if (window.UIUtils) {
                window.UIUtils.setButtonLoading(submitBtn, true, 'Transmitting...');
                matrixLoader = window.UIUtils.showMatrixLoader('TRANSMITTING');
            } else {
                submitBtn.disabled = true;
                hideMessage();
                showMessage('Transmitting...', false);
            }

            try {
                var res = await fetch(ROUND_5_ENDPOINT, {
                    method: 'POST',
                    body: formData
                });
                var data = await res.json().catch(function () { return {}; });
                if (matrixLoader) matrixLoader.remove();
                if (res.ok) {
                    var alreadySubmitted = data.already_submitted === true ||
                        (data.message && String(data.message).toLowerCase().indexOf('already submitted') !== -1);

                    if (alreadySubmitted) {
                        setRound5Submitted();
                        applyAlreadySubmittedState();
                        if (window.UIUtils) window.UIUtils.showToast('Already submitted. Only one submission per group.', 'info', 2000);
                        redirectToMissionComplete();
                    } else {
                        setRound5Submitted();
                        var successMsg = 'Submitted successfully. ' + (data.urls && data.urls.length ? data.urls.length + ' file(s) uploaded.' : '');
                        if (window.UIUtils) {
                            window.UIUtils.showToast(successMsg, 'success', 2000);
                            window.UIUtils.setButtonLoading(submitBtn, false);
                        } else {
                            showMessage(successMsg, false);
                        }
                        redirectToMissionComplete();
                    }
                } else {
                    var errMsg = (window.FormUtils && window.FormUtils.parseApiError(data, res.status)) || data.message || 'Submission failed: ' + res.status;
                    var isAlreadySubmittedError = res.status === 409 || (errMsg && String(errMsg).toLowerCase().indexOf('already submitted') !== -1);
                    if (isAlreadySubmittedError) {
                        setRound5Submitted();
                        applyAlreadySubmittedState();
                        if (window.UIUtils) window.UIUtils.showToast('Already submitted. Only one submission per group.', 'info', 2000);
                        redirectToMissionComplete();
                    } else {
                        if (window.UIUtils) {
                            window.UIUtils.showToast(errMsg, 'error', 4000);
                            window.UIUtils.setButtonLoading(submitBtn, false);
                        } else {
                            showMessage(errMsg, true);
                            submitBtn.disabled = false;
                        }
                    }
                }
            } catch (err) {
                if (matrixLoader) matrixLoader.remove();
                var netErr = 'Network error: ' + (err.message || 'Could not reach server.');
                if (window.UIUtils) {
                    window.UIUtils.showToast(netErr, 'error', 4000);
                    window.UIUtils.setButtonLoading(submitBtn, false);
                } else {
                    showMessage(netErr, true);
                    submitBtn.disabled = false;
                }
            }
        })();

        return false;
    }

    if (formEl) {
        formEl.addEventListener('submit', handleSubmit);
    } else if (submitBtn) {
        submitBtn.addEventListener('click', handleSubmit);
    }

    if (isRound5AlreadySubmitted()) {
        applyAlreadySubmittedState();
        if (window.UIUtils) window.UIUtils.showToast('This team has already submitted. Only one submission per group.', 'info', 3000);
    }

})();
