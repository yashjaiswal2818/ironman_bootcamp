/**
 * Stage 4: Friday Logic Core
 * Handles stagefour_logic_hub.html - Logic nodes + tactical rationale
 * Backend: POST /round_4 (JSON: Team_Name, structured_submission, status_4, question, score_4)
 * Requires: api-config.js, form-utils.js
 */
(function () {
    'use strict';

    var ROUND_4_ENDPOINT = (window.API_CONFIG && window.API_CONFIG.getUrl('round_4')) || 'http://127.0.0.1:8000/round_4';

    function getTeamName() {
        return (window.FormUtils && window.FormUtils.getTeamName()) || (sessionStorage.getItem('teamName') || '').trim() || 'xyz';
    }

    function getRound4SubmittedKey() {
        var team = getTeamName();
        return 'gdg_round4_submitted_' + (team || 'xyz');
    }

    function isRound4AlreadySubmitted() {
        return sessionStorage.getItem(getRound4SubmittedKey()) === 'true';
    }

    function setRound4Submitted() {
        sessionStorage.setItem(getRound4SubmittedKey(), 'true');
    }

    function applyAlreadySubmittedState(submitBtn, feedbackEl) {
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.classList.add('opacity-50', 'cursor-not-allowed');
            if (window.UIUtils) {
                window.UIUtils.setButtonLoading(submitBtn, false);
            }
            submitBtn.innerHTML = '<span class="material-symbols-outlined text-xl">check_circle</span><span class="text-sm font-bold tracking-[0.2em] uppercase relative z-10">ALREADY SUBMITTED</span>';
        }
        if (feedbackEl) {
            showFeedback(feedbackEl, 'This team has already submitted. Only one submission per group.', false);
        }
    }

    function redirectToStageFive() {
        setTimeout(function () {
            window.location.href = 'stagefive.html';
        }, 1500);
    }

    function collectScenarioResponses() {
        var cards = document.querySelectorAll('.scenario-card');
        var responses = [];
        for (var i = 0; i < cards.length; i++) {
            var card = cards[i];
            var scenarioNum = parseInt(card.getAttribute('data-scenario') || (i + 1), 10);
            var suitSelect = card.querySelector('.scenario-suit');
            var actionSelect = card.querySelector('.scenario-action');
            var suit = suitSelect ? suitSelect.value : '';
            var action = actionSelect ? actionSelect.value : '';
            responses.push({ scenario: scenarioNum, suit: suit, action: action });
        }
        return responses;
    }

    var stage4Timer = null;

    function initTimer() {
        var timerWrap = document.getElementById('stage4-timer');
        var timerDisplay = document.getElementById('stage4-timer-display');
        var submitBtn = document.getElementById('initialize-uplink-btn');

        if (!timerWrap || !timerDisplay) return;

        timerWrap.classList.remove('hidden');
        timerWrap.classList.add('flex');

        stage4Timer = window.TimerUtils.init('STAGE_4_DURATION', timerDisplay, function () {
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.classList.add('opacity-50', 'cursor-not-allowed');
            }
            var feedback = document.getElementById('stage4-feedback');
            if (feedback) {
                feedback.classList.remove('hidden');
                feedback.textContent = 'Time is up. Submission disabled.';
                feedback.className = 'text-xs font-mono py-2 text-red-500';
            }
        });

        stage4Timer.start();
    }

    function init() {
        var submitBtn = document.getElementById('initialize-uplink-btn');
        var feedbackEl = document.getElementById('stage4-feedback');

        if (!submitBtn) return;

        // On load: if this team already submitted (from this browser or backend said so), show already-submitted state
        if (isRound4AlreadySubmitted()) {
            applyAlreadySubmittedState(submitBtn, feedbackEl);
            if (window.UIUtils) {
                window.UIUtils.showToast('This team has already submitted. Only one submission per group.', 'info', 3000);
            }
        }

        submitBtn.addEventListener('click', function (e) {
            e.preventDefault();

            // Only one submission per group: if we already know it's submitted, don't send again
            if (isRound4AlreadySubmitted()) {
                if (window.UIUtils) {
                    window.UIUtils.showToast('Already submitted. Redirecting…', 'info', 2000);
                } else {
                    showFeedback(feedbackEl, 'Already submitted. Redirecting…', false);
                }
                redirectToStageFive();
                return;
            }

            if (stage4Timer && stage4Timer.getRemaining() <= 0) {
                if (window.UIUtils) {
                    window.UIUtils.showToast('Time is up. Submission disabled.', 'error', 3000);
                } else {
                    showFeedback(feedbackEl, 'Time is up. Submission disabled.', true);
                }
                return;
            }

            var teamName = getTeamName();
            var responses = collectScenarioResponses();
            var structuredSubmission = JSON.stringify(responses);
            var question = '';
            var status_4 = 'Submitted';
            var score_4 = 0;

            var incomplete = responses.filter(function (r) { return !r.suit || !r.action; });
            if (incomplete.length > 0) {
                showFeedback(feedbackEl, 'Please select Suit and Action for all 8 scenarios.', true);
                return;
            }

            var payload = {
                Team_Name: teamName,
                structured_submission: structuredSubmission,
                status_4: status_4,
                question: question,
                score_4: score_4
            };

            var matrixLoader = null;
            if (window.UIUtils) {
                window.UIUtils.setButtonLoading(submitBtn, true, 'SUBMITTING…');
                matrixLoader = window.UIUtils.showMatrixLoader('SUBMITTING');
            } else {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<span class="material-symbols-outlined text-xl animate-pulse">hourglass_empty</span><span class="text-sm font-bold tracking-[0.2em] uppercase relative z-10">SUBMITTING…</span>';
                showFeedback(feedbackEl, 'Submitting to backend…', false);
            }

            fetch(ROUND_4_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })
                .then(function (res) { return res.json().then(function (data) { return { ok: res.ok, status: res.status, data: data || {} }; }); })
                .then(function (result) {
                    var data = result.data || {};
                    if (matrixLoader) matrixLoader.remove();

                    if (result.ok) {
                        var alreadySubmitted = data.already_submitted === true ||
                            (data.message && String(data.message).toLowerCase().indexOf('already submitted') !== -1);

                        if (alreadySubmitted) {
                            setRound4Submitted();
                            applyAlreadySubmittedState(submitBtn, feedbackEl);
                            if (window.UIUtils) {
                                window.UIUtils.showToast('Already submitted. Only one submission per group.', 'info', 2000);
                            } else {
                                showFeedback(feedbackEl, 'Already submitted. Only one submission per group.', false);
                            }
                        } else {
                            setRound4Submitted();
                            if (window.UIUtils) {
                                window.UIUtils.showToast('Submitted successfully.', 'success', 2000);
                                window.UIUtils.setButtonLoading(submitBtn, false);
                            } else {
                                showFeedback(feedbackEl, 'Submitted successfully.', false);
                            }
                        }
                        if (stage4Timer) stage4Timer.stop();
                        redirectToStageFive();
                    } else {
                        // Backend returned error (e.g. 409 or duplicate): if message says already submitted, treat as success and don't allow resubmit
                        var msg = (window.FormUtils && window.FormUtils.parseApiError(data, result.status)) || 'Submission failed: ' + result.status;
                        var isAlreadySubmittedError = result.status === 409 || (msg && String(msg).toLowerCase().indexOf('already submitted') !== -1);
                        if (isAlreadySubmittedError) {
                            setRound4Submitted();
                            applyAlreadySubmittedState(submitBtn, feedbackEl);
                            if (window.UIUtils) {
                                window.UIUtils.showToast('Already submitted. Only one submission per group.', 'info', 2000);
                            } else {
                                showFeedback(feedbackEl, 'Already submitted. Only one submission per group.', false);
                            }
                            redirectToStageFive();
                        } else {
                            if (window.UIUtils) {
                                window.UIUtils.showToast(msg, 'error', 4000);
                                window.UIUtils.setButtonLoading(submitBtn, false);
                            } else {
                                showFeedback(feedbackEl, msg, true);
                                submitBtn.disabled = false;
                                resetSubmitButton(submitBtn);
                            }
                        }
                    }
                })
                .catch(function (err) {
                    if (matrixLoader) matrixLoader.remove();
                    var errMsg = 'Network error: ' + (err.message || 'Could not reach server.');
                    if (window.UIUtils) {
                        window.UIUtils.showToast(errMsg, 'error', 4000);
                        window.UIUtils.setButtonLoading(submitBtn, false);
                    } else {
                        showFeedback(feedbackEl, errMsg, true);
                        submitBtn.disabled = false;
                        resetSubmitButton(submitBtn);
                    }
                });
        });
    }

    function resetSubmitButton(btn) {
        btn.innerHTML = '<div class="absolute inset-0 bg-primary/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>' +
            '<span class="material-symbols-outlined text-xl transition-transform group-hover:rotate-90">send</span>' +
            '<span class="text-sm font-bold tracking-[0.2em] uppercase relative z-10">Submit Responses</span>' +
            '<span class="material-symbols-outlined text-xl transition-transform group-hover:-rotate-90">send</span>';
    }

    function showFeedback(el, text, isError) {
        if (!el) return;
        el.textContent = text;
        el.classList.remove('hidden');
        el.className = 'text-xs font-mono py-2 ' + (isError ? 'text-red-400' : 'text-emerald-400');
    }

    document.addEventListener('DOMContentLoaded', function () {
        // Timers disabled for Round 4 preview; do not start countdown
        // if (window.TimerUtils) {
        //     initTimer();
        // }
        init();
    });
})();
