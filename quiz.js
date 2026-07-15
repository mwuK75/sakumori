// --- 1. 問題データ（questions.json を読み込む） ---
let quizzesData = [];
let currentQuestionIndex = 0;
let correctCount = 0;
let questionTimeLeft = 90;
let totalTimeLeft = 180;
let timerId = null;
let allCorrectAnswers = [];
const targetCorrectPerQuestion = 5;
let answerSlotIndex = 0;

function normalizeQuiz(item) {
    return {
        id: item.id || 0,
        author: item.author || '不明',
        genre: item.genre || '未分類',
        question: item.question || '',
        validAnswers: Array.isArray(item.answers)
            ? item.answers
            : String(item.answers || '')
                .split(',')
                .map(answer => answer.trim())
                .filter(Boolean)
    };
}

async function loadQuizzesData() {
    try {
        const response = await fetch('questions.json');
        if (!response.ok) {
            throw new Error('questions.json を読み込めませんでした');
        }
        const data = await response.json();
        quizzesData = Array.isArray(data) ? data.map(normalizeQuiz) : [];
        if (quizzesData.length === 0) {
            throw new Error('questions.json に問題がありません');
        }
    } catch (error) {
        console.error(error);
        quizzesData = [
            {
                id: 1,
                author: 'サンプル',
                genre: '地理',
                question: '日本の都道府県をできるだけ答えよう',
                validAnswers: ['北海道', '青森県', '岩手県', '宮城県']
            }
        ];
    }
}

// --- 2. HTML要素の取得 ---
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

// 評価ボタン
let likeCount = 0;
let liked = false;
let certified = false;
const btnLike = document.getElementById('btn-like');
const btnCertify = document.getElementById('btn-certify');

if (btnLike) {
    btnLike.addEventListener('click', function() {
        if (liked) return;
        liked = true;
        likeCount++;
        document.getElementById('like-count').textContent = likeCount;
        this.classList.add('pressed');
        this.disabled = true;
    });
}

if (btnCertify) {
    btnCertify.addEventListener('click', function() {
        if (certified) return;
        certified = true;
        this.classList.add('pressed');
        this.textContent = '👑 良問認定済み';
        this.disabled = true;
    });
}

// --- 4. ゲーム進行 ---
function updateDisplay() {
    const currentQuiz = quizzesData[currentQuestionIndex];
    if (!currentQuiz) return;

    questionNumberDisplay.textContent = `${currentQuestionIndex + 1}/${quizzesData.length}`;
    correctCountDisplay.textContent = `${correctCount}/${targetCorrectPerQuestion}`;
    timeLeftDisplay.textContent = `${questionTimeLeft}秒`;

    document.getElementById('question-text').textContent = `Q. ${currentQuiz.question}`;
    document.getElementById('current-turn-label').textContent = `${currentQuiz.genre} / 作問者: ${currentQuiz.author}`;
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
            moveToNextQuestion();
        }
    }, 1000);
}

function moveToNextQuestion() {
    clearInterval(timerId);
    currentQuestionIndex++;

    if (currentQuestionIndex >= quizzesData.length) {
        showResult();
        return;
    }

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

    answerInput.focus();
    updateDisplay();
    startTimer();
}

function handleCorrect(answer) {
    correctCount++;
    allCorrectAnswers.push({
        question: currentQuestionIndex + 1,
        answer: answer
    });

    const slotElement = document.getElementById(`slot-answer-${answerSlotIndex}`);
    if (slotElement) {
        const slotIcon = slotElement.querySelector('.slot-icon');
        const slotAnswer = slotElement.querySelector('.slot-answer');
        slotIcon.textContent = '';
        slotAnswer.textContent = answer;
        slotElement.classList.add('opened');
    }
    answerSlotIndex++;

    feedback.textContent = '⭕ 正解！';
    feedback.classList.add('correct');

    answerInput.value = '';
    updateDisplay();

    if (correctCount >= targetCorrectPerQuestion) {
        setTimeout(() => {
            moveToNextQuestion();
        }, 800);
    } else {
        answerInput.focus();
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
    setTimeout(() => {
        feedback.textContent = '';
        feedback.classList.remove('wrong');
    }, 1000);
}

function showResult() {
    resultScreen.style.display = 'flex';
    resultTitle.textContent = "🎉 ゲーム終了！ 🎉";
    
    const totalCorrect = allCorrectAnswers.length;
    const maxCorrect = targetCorrectPerQuestion * quizzesData.length;
    resultMessage.textContent = `合計 ${totalCorrect}/${maxCorrect} 個の正解をゲットしました！`;
    
    // 全正解を表示
    if (resultAnswer) {
        let answerText = "🎯 正解した答え：\n";
        for (let i = 0; i < quizzesData.length; i++) {
            const questionAnswers = allCorrectAnswers.filter(a => a.question === i + 1);
            const answersStr = questionAnswers.map(a => a.answer).join('、');
            answerText += `問題${i + 1}: ${answersStr}\n`;
        }
        resultAnswer.textContent = answerText;
    }
}

// --- 5. 入力イベント ---
answerInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        const val = answerInput.value.trim();
        const currentQuiz = quizzesData[currentQuestionIndex];

        if (!currentQuiz) return;

        const hasAlreadyAnswered = allCorrectAnswers.some(
            a => a.question === currentQuestionIndex + 1 && a.answer === val
        );

        if (hasAlreadyAnswered) {
            handleWrong();
            return;
        }

        const isCorrect = currentQuiz.validAnswers.includes(val);
        if (isCorrect) {
            handleCorrect(val);
        } else {
            handleWrong();
        }
    }
});

async function initGame() {
    await loadQuizzesData();
    updateDisplay();
    startTimer();
}

initGame();