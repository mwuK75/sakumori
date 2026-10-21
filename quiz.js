let gameStartTime = 0;
const processedAnswerIds = new Set();
const gameAnswerLog = [];
let studentAnswerPollId = null;
let feedbackTimeout = null;
let submittedAnswerTimeout = null;

// 生徒回答を取得する関数
async function loadStudentAnswers() {

    const response =
        await fetch(
            "https://script.google.com/macros/s/AKfycby6wQFYHOi0Dp2m3sxSm8uuoxMMzEEzVFtXbEY3uKLiTUn_QhZmlxVcyXEwDjBfSOMH/exec"
        );

    if (!response.ok) {
        throw new Error(`回答データの取得に失敗しました: ${response.status}`);
    }

    const data = await response.json();
    if (!Array.isArray(data)) {
        throw new Error('回答データの形式が正しくありません');
    }

    const submissionOccurrences = new Map();
    for (const item of data) {
        const answerTime = new Date(item.timestamp).getTime();
        const questionIndex = Number(item.questionId) - 1;
        const answer = String(item.answer || '').trim();
        const name = String(item.name || '').trim() || '名前未入力';
        const fingerprint = JSON.stringify([
            item.timestamp,
            item.questionId,
            name,
            answer
        ]);
        const occurrence = (submissionOccurrences.get(fingerprint) || 0) + 1;
        submissionOccurrences.set(fingerprint, occurrence);

        if (
            !Number.isFinite(answerTime) ||
            answerTime < gameStartTime ||
            answer === '' ||
            !Number.isInteger(questionIndex) ||
            questionIndex < 0 ||
            questionIndex >= quizzesData.length ||
            questionIndex > currentQuestionIndex
        ) {
            continue;
        }

        const submissionId = item.id != null && String(item.id) !== ''
            ? String(item.id)
            : JSON.stringify([fingerprint, occurrence]);
        if (processedAnswerIds.has(submissionId)) {
            continue;
        }
        processedAnswerIds.add(submissionId);

        const quiz = quizzesData[questionIndex];
        const isCorrect = quiz.validAnswers.some(
            validAnswer => validAnswer.trim() === answer
        );

        gameAnswerLog.push({
            name,
            question: questionIndex + 1,
            answer,
            isCorrect
        });

        if (
            questionIndex === currentQuestionIndex &&
            !isTimeUp &&
            resultScreen.style.display === 'none'
        ) {
            showSubmittedAnswer(answer);
            checkStudentAnswer(answer);
        }
    }
}
// 正解判定関数
function checkStudentAnswer(answer) {
    const currentQuiz =
        quizzesData[
            currentQuestionIndex
        ];

    if(!currentQuiz) {
        return;
    }

    const normalized =
        answer.trim();
    if(normalized === ''){
    return;
}
    const isCorrect = currentQuiz.validAnswers.some(
        correctAnswer => correctAnswer.trim() === normalized
    );

    if(isCorrect) {

        let alreadyAnswered =
            false;

        for(
            const answerData
            of allCorrectAnswers
        ) {

            if(
                answerData.question ===
                currentQuestionIndex + 1 &&
                answerData.answer ===
                normalized
            ) {

                alreadyAnswered =
                    true;

            }

        }

        if(!alreadyAnswered) {

            handleCorrect(
                normalized
            );
        } else {
            showAnswerFeedback(
                'その答えはすでに回答されました',
                'duplicate'
            );
        }
    } else {
        handleWrong();
    }
}
// --- 問題データ ---
let quizzesData = [];
const STORAGE_KEY = 'sakumon-ratings';

const selectedGenres =
    JSON.parse(
        localStorage.getItem('selectedGenres')
    ) || [];

function normalizeQuiz(item) {

const answers = [];

if (Array.isArray(item.answers)) {

    for (const answer of item.answers) {
        answers.push(answer);
    }

} else {

    const answerList =
        String(item.answers || '').split(',');

    for (const answer of answerList) {

        const trimmed = answer.trim();

        if (trimmed !== '') {
            answers.push(trimmed);
        }
    }
}


    return {
        id: item.id || 0,
        author: item.author || '不明',
        genre: item.genre || '未分類',
        question: item.question || '',
        validAnswers: answers,
        ratings: item.ratings || { fun: 0, useful: 0, difficult: 0 }
    };
}
function shuffleArray(array) {

    const shuffled = [...array];

    for (let i = shuffled.length - 1; i > 0; i--) {

        const j =
            Math.floor(
                Math.random() * (i + 1)
            );

        [shuffled[i], shuffled[j]] =
            [shuffled[j], shuffled[i]];
    }

    return shuffled;
}
async function loadQuizzesData() {

    try {

        const response = await fetch(
            'https://script.google.com/macros/s/AKfycbztQoWbf96IXurDhfTeLqDA3eMbsUu7zEQwQKNjQvZzq9k8hdp4LoopCPsMuW3-z1uuFA/exec'
        );

        if (!response.ok) {
            throw new Error('問題データを取得できません');
        }

        const data = await response.json();

        if (Array.isArray(data)) {

            quizzesData = [];

            for (const item of data) {

                quizzesData.push(
                    normalizeQuiz(item)
                );

            }

            if (selectedGenres.length > 0) {

                quizzesData =
                    quizzesData.filter(
                        quiz =>
                            selectedGenres.includes(
                                quiz.genre.trim()
                            )
                    );

            }

if (quizzesData.length === 0) {

    alert(
        '選択したジャンルの問題がありません。'
    );

    location.href = 'index.html';

    return;
}

if (quizzesData.length < 5) {

    alert(
        `選択したジャンルの問題数は ${quizzesData.length} 問です。`
    );

}

quizzesData =
    shuffleArray(quizzesData);

quizzesData =
    quizzesData.slice(0, 5);

            const storedRatings =
                JSON.parse(
                    localStorage.getItem(
                        STORAGE_KEY
                    ) || '[]'
                );

            if (Array.isArray(storedRatings)) {

                for (const stored of storedRatings) {

                    const matchedQuiz =
                        quizzesData.find(
                            q =>
                                Number(q.id) ===
                                Number(stored.id)
                        );

                    if (
                        matchedQuiz &&
                        stored.ratings
                    ) {

                        matchedQuiz.ratings =
                            stored.ratings;

                    }
                }
            }

        } else {

            quizzesData = [];

        }

        if (quizzesData.length === 0) {

            throw new Error(
                '問題データがありません'
            );

        }

    } catch (error) {

        console.error(error);

        quizzesData = [
            {
                id: 1,
                author: 'サンプル',
                genre: 'サンプル',
                question: 'サンプル問題',
                validAnswers: ['A', 'B', 'C']
            }
        ];

    }

}

// --- 2. ゲーム状態 ---
let currentQuestionIndex = 0;
let activeQuiz = null;
let correctCount = 0;           // 現在の問題での正解数
let questionTimeLeft = 90;      // 各問題の時間
let timerId = null;
let isTimeUp = false;
const allCorrectAnswers = [];   // すべての正解を記録
const targetCorrectPerQuestion = 5; // 1問あたりの目標正解数
let answerSlotIndex = 0;        // 現在のスロットインデックス

// --- 3. HTML要素の取得 ---
const timeBar = document.getElementById('time-bar');
const resultScreen = document.getElementById('result-screen');
const resultTitle = document.getElementById('result-title');
const resultMessage = document.getElementById('result-message');
const resultAnswer = document.getElementById('result-answer');
const feedback = document.getElementById('feedback');
const questionNumberDisplay = document.getElementById('question-number');
const correctCountDisplay = document.getElementById('correct-count');
const timeLeftDisplay = document.getElementById('time-left');
const questionMetaDisplay = document.getElementById('question-meta');
const questionAuthorDisplay = document.getElementById('question-author');
const ratingButtons = document.querySelectorAll('.rating-btn');
const ratingFunCount = document.getElementById('rating-fun-count');
const ratingUsefulCount = document.getElementById('rating-useful-count');
const ratingDifficultCount = document.getElementById('rating-difficult-count');
const ratingPanel = document.getElementById('rating-panel');
const btnNextQuestion = document.getElementById('btn-next-question');
const btnReplay = document.getElementById('btn-replay');
const awardsScreen = document.getElementById('awards-screen');
const btnHomeReturn =
    document.getElementById(
        'btn-home-return'
    );
// --- 4. ゲーム進行 ---
function updateDisplay() {
    if (!quizzesData.length) return;

    const currentQuiz = quizzesData[currentQuestionIndex];
    activeQuiz = currentQuiz;

    // 問題番号と正解数を更新
    questionNumberDisplay.textContent = `${currentQuestionIndex + 1}/${quizzesData.length}`;
    correctCountDisplay.textContent = `${correctCount}/${targetCorrectPerQuestion}`;
    timeLeftDisplay.textContent = `${questionTimeLeft}秒`;

    // 現在の問題を表示
    document.getElementById('question-text').textContent = `Q. ${currentQuiz.question}`;
    questionMetaDisplay.textContent = `ジャンル: ${currentQuiz.genre}`;
    questionAuthorDisplay.textContent = `作問者: ${currentQuiz.author}`;
    document.getElementById('answer-instructions').hidden = false;
}

function startTimer() {
    timerId = setInterval(function() {
        questionTimeLeft--;
        
        // タイムバーを更新（各問題の90秒を基準）
        const percentage = (questionTimeLeft / 90) * 100;
        timeBar.style.width = Math.max(0, percentage) + '%';
        const progress = (questionTimeLeft / 90) * 100;

    bombImage.style.left =
    `calc(${progress}% - 40px)`;
        
        timeLeftDisplay.textContent = `${questionTimeLeft}秒`;
        if (questionTimeLeft <= 10) {
            bombImage.style.animation = 'bombShake 0.2s infinite';

            if (soundTimer.paused) {
                soundTimer.loop = true;
                soundTimer.currentTime = 0;
                playGameSound(soundTimer);
            }
        } else {
            soundTimer.pause();
            soundTimer.currentTime = 0;
            soundTimer.loop = false;
        }

        // 問題ごとの時間が終了
if (questionTimeLeft <= 0) {

    soundTimer.pause();
    soundTimer.currentTime = 0;
    soundTimer.loop = false;

    soundExplosion.currentTime = 0;
    playGameSound(soundExplosion);

    bombImage.src =
    'picture/bakuhatsu.png';

    bombImage.style.width =
    '240px';

    bombImage.style.height =
    '240px';

    bombImage.style.left =
    'calc(0% - 120px)';

    bombImage.style.top =
    '-120px';
    isTimeUp = true;

    showQuestionRatingScreen();

}
    }, 1000);
}

function resetRatingButtons() {
    for (const button of ratingButtons) {
        button.disabled = false;
        button.classList.remove('pressed');
    }
}

function showQuestionRatingScreen() {
    clearInterval(timerId);
    resultScreen.style.display = 'flex';
    if (isTimeUp) {
        resultTitle.textContent =
            '時間切れ！😿';
    }
    // } else {
    //     resultTitle.textContent =
    //         'この問題を評価しよう';
    // }

    if (activeQuiz) {
        resultMessage.textContent =
            activeQuiz.question;
    } else {
        resultMessage.textContent = '';
    }
    if (resultAnswer && activeQuiz) {

    resultAnswer.style.display =
        'block';

    const answered = [];

    for (const answerData of allCorrectAnswers) {
        if (
            answerData.question ===
            currentQuestionIndex + 1
        ) {
            answered.push(
                answerData.answer
            );
        }

    }

    const remainingAnswers =
        activeQuiz.validAnswers.filter(
            answer =>
                !answered.includes(answer)
        );

    const sampleAnswers =
    remainingAnswers.slice(0, 3);

if (sampleAnswers.length > 0) {
    resultAnswer.textContent =
        '他の答えの例：' +
        sampleAnswers.join('、');
} else {
    resultAnswer.textContent =
        '他の答えはありません！';
}
}

    if (ratingPanel) {
        ratingPanel.style.display =
            'block';
    }

    if (btnNextQuestion) {
        btnNextQuestion.style.display =
            'inline-block';
    }

    if (btnReplay) {
        btnReplay.style.display =
            'none';
    }
    if (btnHomeReturn) {
    btnHomeReturn.addEventListener(
        'click',
        function() {
            location.href =
                'index.html';
        }
    );

}

    resetRatingButtons();

    updateRatingDisplay();

}

async function showResult() {
    const awardsDataWarning = document.getElementById('awards-data-warning');
    if (studentAnswerPollId !== null) {
        clearInterval(studentAnswerPollId);
        studentAnswerPollId = null;
    }

    try {
        await loadStudentAnswers();
    } catch (error) {
        console.error('終了時の回答データ取得に失敗しました', error);
        awardsDataWarning.hidden = false;
        awardsDataWarning.textContent =
            '最新の回答を取得できなかったため、取得済みデータで表彰を集計しました。';
    }

    resultScreen.style.display = 'flex';
    resultTitle.textContent = '🎉 ゲーム終了！ 🎉';

    const totalCorrect = allCorrectAnswers.length;
    const maxCorrect = targetCorrectPerQuestion * quizzesData.length;
    resultMessage.textContent = `合計 ${totalCorrect}/${maxCorrect} 個の正解をゲットしました！`;

    if (resultAnswer) {
        resultAnswer.style.display = 'block';
        let answerText = '🙆正解した答え：\n';
        for (let i = 0; i < quizzesData.length; i++) {
            let answersStr = '';

for (const answerData of allCorrectAnswers) {

    if (answerData.question === i + 1) {
        if (answersStr !== '') {
            answersStr += '、';
        }
        answersStr += answerData.answer;
    }
}
            answerText += `問題${i + 1}: ${answersStr}\n`;
        }
        resultAnswer.textContent = answerText;
    }

    if (ratingPanel) {
        ratingPanel.style.display = 'none';
    }
    if (btnNextQuestion) {
        btnNextQuestion.style.display = 'none';
    }
    if (btnReplay) {
        btnReplay.style.display = 'none';
    }
    if (btnHomeReturn) {
        btnHomeReturn.style.display = 'none';
    }
    if (awardsScreen) {
        awardsScreen.hidden = true;
    }
    showAwards();
}

function getWinners(countFor) {
    const totals = new Map();

    for (const entry of gameAnswerLog) {
        const currentTotal = totals.get(entry.name) || 0;
        totals.set(entry.name, currentTotal + (countFor(entry) ? 1 : 0));
    }

    const highestCount = Math.max(0, ...totals.values());
    if (highestCount === 0) return [];

    return [...totals.entries()]
        .filter(([, count]) => count === highestCount)
        .map(([name, count]) => ({ name, count }));
}

function showWinners(elementId, winners, countLabel) {
    const element = document.getElementById(elementId);

    if (winners.length === 0) {
        element.textContent = '該当する回答はありません';
        return;
    }

    element.textContent = winners
        .map(winner => `${winner.name}さん（${countLabel}：${winner.count}）`)
        .join('、');
}

function showAwards() {
    showWinners(
        'most-correct-winners',
        getWinners(entry => entry.isCorrect),
        '正解数'
    );
    showWinners(
        'most-attempts-winners',
        getWinners(() => true),
        '回答数'
    );

    awardsScreen.hidden = false;
    btnReplay.style.display = 'inline-block';
    btnHomeReturn.style.display = 'inline-block';
}

function moveToNextQuestion() {
    clearInterval(timerId);
    currentQuestionIndex++;

    if (currentQuestionIndex >= quizzesData.length) {
        void showResult();
    } else {
        correctCount = 0;
        answerSlotIndex = 0;
        questionTimeLeft = 90;
        isTimeUp = false;
        clearTimeout(submittedAnswerTimeout);
        document.getElementById('wrong-answer-area').textContent = '';
bombImage.src =
    'picture/bakudan.png';

bombImage.style.width =
    '80px';

bombImage.style.height =
    '80px';

bombImage.style.top =
    '-28px';

bombImage.style.left =
    'calc(100% - 40px)';

bombImage.style.animation =
    'none';
        feedback.textContent = '';

        for (let i = 0; i < 5; i++) {
            const slotElement = document.getElementById(`slot-answer-${i}`);
            if (slotElement) {
                slotElement.classList.remove('opened');
                slotElement.querySelector('.slot-icon').textContent = '❓';
                slotElement.querySelector('.slot-answer').textContent = '';
            }
        }

        resultScreen.style.display = 'none';
        updateDisplay();
        startTimer();
    }
}

function handleCorrect(answer) {
    soundCorrect.currentTime = 0;
    playGameSound(soundCorrect);
    correctCount++;
    allCorrectAnswers.push({
        question: currentQuestionIndex + 1,
        answer: answer
    });
    
    // スロットを開く（パッと表示）
    const slotElement = document.getElementById(`slot-answer-${answerSlotIndex}`);
    if (slotElement) {
        const slotIcon = slotElement.querySelector('.slot-icon');
        const slotAnswer = slotElement.querySelector('.slot-answer');
        slotIcon.textContent = '';
        slotAnswer.textContent = answer;
        slotElement.classList.add('opened');
    }
    answerSlotIndex++;
    
    // フィードバック表示
    showAnswerFeedback('⭕ 正解！', 'correct');
    
    updateDisplay();
    
    // 5個正解で次の問題へ
if (correctCount >= targetCorrectPerQuestion) {
    setTimeout(function() {

        isTimeUp = false;
        showQuestionRatingScreen();
    }, 800);
    }
}


function handleWrong() {

    soundWrong.currentTime = 0;
    playGameSound(soundWrong);

    showAnswerFeedback('❌ ハズレ！', 'wrong');
}

function showSubmittedAnswer(answer) {
    const submittedAnswerArea =
        document.getElementById('wrong-answer-area');

    clearTimeout(submittedAnswerTimeout);
    submittedAnswerArea.textContent = answer;
    submittedAnswerTimeout = setTimeout(function() {
        submittedAnswerArea.textContent = '';
    }, 5000);
}

function showAnswerFeedback(message, resultClass) {
    clearTimeout(feedbackTimeout);
    feedback.textContent = message;
    feedback.classList.remove('correct', 'wrong', 'duplicate');
    feedback.classList.add(resultClass);

    feedbackTimeout = setTimeout(function() {
        feedback.textContent = '';
        feedback.classList.remove(resultClass);
    }, 1000);
}

function saveRatingsToStorage() {
    if (!activeQuiz) return;

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    let existingIndex = -1;

for (let i = 0; i < stored.length; i++) {
    if (Number(stored[i].id) === Number(activeQuiz.id)) {
        existingIndex = i;
    }
}

    const newItem = {
        id: activeQuiz.id,
        ratings: activeQuiz.ratings || { fun: 0, useful: 0, difficult: 0 }
    };

    if (existingIndex >= 0) {
        stored[existingIndex] = newItem;
    } else {
        stored.push(newItem);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
}
function updateRatingDisplay() {
    if (!activeQuiz) return;

    ratingFunCount.textContent = activeQuiz.ratings?.fun || 0;
    ratingUsefulCount.textContent = activeQuiz.ratings?.useful || 0;
    ratingDifficultCount.textContent = activeQuiz.ratings?.difficult || 0;
}

for (const button of ratingButtons) {
    button.addEventListener('click', function() {
        if (!activeQuiz) return;

        let key = '';
        if (this.id === 'rating-btn-fun') {
            key = 'fun';
        }
        if (this.id === 'rating-btn-useful') {
            key = 'useful';
        }
        if (this.id === 'rating-btn-difficult') {
            key = 'difficult';
        }
        if (!key) return;

        if (!activeQuiz.ratings) {
            activeQuiz.ratings = {
                fun: 0,
                useful: 0,
                difficult: 0
            };
        }

        activeQuiz.ratings[key] = (activeQuiz.ratings[key] || 0) + 1;
        this.disabled = true;
        this.classList.add('pressed');

        updateRatingDisplay();
        saveRatingsToStorage();
    });
}

if (btnNextQuestion) {
    btnNextQuestion.addEventListener('click', function() {
        soundDecision.currentTime = 0;
        playGameSound(soundDecision);
        moveToNextQuestion();
    });
}

if (btnReplay) {
    btnReplay.addEventListener('click', function() {
        location.reload();
    });
}

// ゲーム開始
async function initGame() {

    await loadQuizzesData();

    gameStartTime = Date.now();
    updateDisplay();

    startTimer();

    studentAnswerPollId = setInterval(() => {
        loadStudentAnswers().catch(error => {
            console.error('回答データの定期取得に失敗しました', error);
        });
    }, 2000);

}

const soundDecision =
    new Audio('sound/決定.mp3');

const soundCorrect =
    new Audio('sound/クイズ正解.mp3');

const soundWrong =
    new Audio('sound/クイズ不正解.mp3');

const soundExplosion =
    new Audio('sound/爆発.mp3');

const soundTimer =
    new Audio('sound/タイマー.mp3');

const gameSounds = [
    soundDecision,
    soundCorrect,
    soundWrong,
    soundExplosion,
    soundTimer
];

function playGameSound(sound) {
    sound.play().catch(error => {
        console.warn(`効果音を再生できませんでした: ${sound.src}`, error);
    });
}

function unlockGameSounds() {
    for (const sound of gameSounds) {
        sound.muted = true;
        sound.play()
            .then(() => {
                sound.pause();
                sound.currentTime = 0;
                sound.muted = false;
            })
            .catch(error => {
                sound.muted = false;
                console.warn('効果音を有効にできませんでした', error);
            });
    }

    document.removeEventListener('pointerdown', unlockGameSounds);
    document.removeEventListener('keydown', unlockGameSounds);
}

document.addEventListener('pointerdown', unlockGameSounds, { once: true });
document.addEventListener('keydown', unlockGameSounds, { once: true });

const bombImage =
    document.getElementById(
        'bomb-image'
    );
initGame();