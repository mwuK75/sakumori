// --- 1. 問題データ（questions.json を読み込む） ---
let quizzesData = [];
const STORAGE_KEY = 'sakumon-ratings';

const selectedGenres =
    JSON.parse(
        localStorage.getItem('selectedGenres')
    ) || [];
console.log(
    'selectedGenres =',
    selectedGenres
);

function normalizeQuiz(item) {

let answers = [];

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
console.log(
    quizzesData.map(
        q => q.genre
    )
);
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

            console.log(
                '全ジャンル',
                quizzesData.map(q => q.genre)
            );

            if (selectedGenres.length > 0) {

                quizzesData =
                    quizzesData.filter(
                        quiz =>
                            selectedGenres.includes(
                                quiz.genre.trim()
                            )
                    );

            }

            console.log(
    '絞り込み後',
    quizzesData.map(q => q.genre)
);

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
let totalTimeLeft = 180;        // 全体時間
let questionTimeLeft = 90;      // 各問題の時間
let timerId = null;
let isTimeUp = false;
let allCorrectAnswers = [];     // すべての正解を記録
const targetCorrectPerQuestion = 5; // 1問あたりの目標正解数
let answerSlotIndex = 0;        // 現在のスロットインデックス

const playerName =
    localStorage.getItem('playerName') || 'みんな';

// --- 3. HTML要素の取得 ---
const answerInput = document.getElementById('answer-input');
const timeBar = document.getElementById('time-bar');
const currentTurnLabel = document.getElementById('current-turn-label');
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
const fairyMessage =
    document.getElementById(
        'fairy-message'
    );
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

    currentTurnLabel.textContent = `${playerName}、みんなの答えを入力してね！`;
}

function startTimer() {
    timerId = setInterval(function() {
        totalTimeLeft--;
        questionTimeLeft--;
        
        // タイムバーを更新（各問題の90秒を基準）
        const percentage = (questionTimeLeft / 90) * 100;
        timeBar.style.width = Math.max(0, percentage) + '%';
        
        timeLeftDisplay.textContent = `${questionTimeLeft}秒`;

        // 問題ごとの時間が終了
        if (questionTimeLeft <= 0) {
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
    } else {
        resultTitle.textContent =
            'この問題を評価しよう';
    }

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

    if (fairyMessage) {
        fairyMessage.style.display =
            'none';
    }

    resetRatingButtons();

    updateRatingDisplay();

}

function showResult() {
    resultScreen.style.display = 'flex';
    resultTitle.textContent = '🎉 ゲーム終了！ 🎉';

    const totalCorrect = allCorrectAnswers.length;
    const maxCorrect = targetCorrectPerQuestion * quizzesData.length;
    resultMessage.textContent = `合計 ${totalCorrect}/${maxCorrect} 個の正解をゲットしました！`;

    const scoreRate =
    totalCorrect / maxCorrect;

let fairyMessages = [];

if (scoreRate >= 0.8) {

    fairyMessages = [
        `${playerName}は詳しすぎない？`,
        `${playerName}は森の博士かも...`,
        `${playerName}、今日IQ高くない？`
    ];

} else if (scoreRate >= 0.5) {

    fairyMessages = [
        `${playerName}、なかなかやるね！`,
        `森の妖精も感心しています。`,
        `${playerName}、また遊びに来てね！`
    ];

} else {

    fairyMessages = [
        `大丈夫！また挑戦してみよう！`,
        `${playerName}の次の挑戦を待ってるよ！`
    ];

}

const randomFairyMessage =
    fairyMessages[
        Math.floor(
            Math.random() *
            fairyMessages.length
        )
    ];

fairyMessage.textContent =
    `👼 森の妖精「${randomFairyMessage}」`;

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
console.log(fairyMessage);
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
        btnReplay.style.display = 'inline-block';
    }
    if (btnHomeReturn) {
    btnHomeReturn.style.display = 'inline-block';
    }
if (fairyMessage) {
    fairyMessage.style.display = 'block';
}
}

function moveToNextQuestion() {
    clearInterval(timerId);
    currentQuestionIndex++;

    if (currentQuestionIndex >= quizzesData.length) {
        showResult();
    } else {
        correctCount = 0;
        answerSlotIndex = 0;
        questionTimeLeft = 90;
        answerInput.value = '';
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
        answerInput.focus();
        updateDisplay();
        startTimer();
    }
}

function handleCorrect(answer) {
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
    feedback.textContent = '⭕ 正解！';
    feedback.classList.remove('wrong');
    feedback.classList.add('correct');
    
    answerInput.value = '';
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
    // フィードバック表示
    feedback.textContent = '❌ ハズレ！';
    feedback.classList.remove('correct');
    feedback.classList.add('wrong');
    
    answerInput.value = '';
    answerInput.focus();
    
    // 1秒後にフィードバッククリア
 setTimeout(function() {
    feedback.textContent = '';
    feedback.classList.remove('wrong');
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
        moveToNextQuestion();
    });
}

if (btnReplay) {
    btnReplay.addEventListener('click', function() {
        location.reload();
    });
}

// --- 5. 入力イベント ---
answerInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        const val = answerInput.value.trim();
        const currentQuiz = quizzesData[currentQuestionIndex];

        if (!currentQuiz) return;

        const normalizedInput = val.replace(/\s+/g, '');
        const normalizedAnswers = [];

for (const answer of currentQuiz.validAnswers) {
    normalizedAnswers.push(
        answer.replace(/\s+/g, '')
    );
}

let isCorrect = false;

for (const answer of normalizedAnswers) {
    if (answer === normalizedInput) {
        isCorrect = true;
    }
}
    let alreadyAnswered = false;

for (const answerData of allCorrectAnswers) {
    if (
        answerData.question === currentQuestionIndex + 1 &&
        answerData.answer === val
    ) {
        alreadyAnswered = true;
    }
}        

        if (isCorrect && !alreadyAnswered) {
            handleCorrect(val);
        } else {
            handleWrong();
        }
    }
});

// ゲーム開始
async function initGame() {
    await loadQuizzesData();
    updateDisplay();
    startTimer();
}
console.log(selectedGenres);

initGame();