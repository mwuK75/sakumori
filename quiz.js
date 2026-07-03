// --- 1. 問題データ（複数問題対応） ---
const quizzesData = [
    {
        question: "環状線（山手線・大阪環状線）の駅の名前を答えよ！",
        validAnswers: ["東京", "有楽町", "新橋", "浜松町", "田町", "高輪ゲートウェイ", "品川", "大崎", "五反田", "目黒", "恵比寿", "渋谷", "原宿", "代々木", "新宿", "新大久保", "高田馬場", "目白", "池袋", "大塚", "巣鴨", "駒込", "田端", "西日暮里", "日暮里", "鶯谷", "上野", "御徒町", "秋葉原", "神田", "大阪", "天満", "桜ノ宮", "京橋", "大阪城公園", "森ノ宮", "玉造", "鶴橋", "桃谷", "寺田町", "天王寺", "新今宮", "今宮", "芦原橋", "大正", "弁天町", "西九条", "野田", "福島"]
    },
    {
        question: "日本の都道府県の名前を答えよ！",
        validAnswers: ["北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県", "茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県", "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県", "静岡県", "愛知県", "三重県", "滋賀県", "京都府", "大阪府", "兵庫県", "奈良県", "和歌山県", "鳥取県", "島根県", "岡山県", "広島県", "山口県", "徳島県", "香川県", "愛媛県", "高知県", "福岡県", "佐賀県", "長崎県", "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県"]
    }
];

// --- 2. ゲーム状態 ---
let currentQuestionIndex = 0;
let correctCount = 0;           // 現在の問題での正解数
let totalTimeLeft = 180;        // 全体時間
let questionTimeLeft = 90;      // 各問題の時間
let timerId = null;
let allCorrectAnswers = [];     // すべての正解を記録
const targetCorrectPerQuestion = 5; // 1問あたりの目標正解数
let answerSlotIndex = 0;        // 現在のスロットインデックス

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
    // 問題番号と正解数を更新
    questionNumberDisplay.textContent = `${currentQuestionIndex + 1}/${quizzesData.length}`;
    correctCountDisplay.textContent = `${correctCount}/${targetCorrectPerQuestion}`;
    timeLeftDisplay.textContent = `${questionTimeLeft}秒`;
    
    // 現在の問題を表示
    document.getElementById('question-text').textContent = quizzesData[currentQuestionIndex].question;
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
    
    // すべての問題が終了
    if (currentQuestionIndex >= quizzesData.length) {
        showResult();
    } else {
        // 次の問題へ
        correctCount = 0;
        answerSlotIndex = 0;  // スロットインデックスをリセット
        questionTimeLeft = 90;
        answerInput.value = '';
        feedback.textContent = '';
        
        // スロットをリセット（❓に戻す）
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
    feedback.classList.add('correct');
    
    answerInput.value = '';
    updateDisplay();
    
    // 5個正解で次の問題へ
    if (correctCount >= targetCorrectPerQuestion) {
        setTimeout(() => {
            moveToNextQuestion();
        }, 800); // 0.8秒後に次へ
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
        
        // 正解判定
        if (currentQuiz.validAnswers.includes(val)) {
            // 重複チェック
            const alreadyAnswered = allCorrectAnswers.some(
                a => a.question === currentQuestionIndex + 1 && a.answer === val
            );
            if (alreadyAnswered) {
                handleWrong();
            } else {
                handleCorrect(val);
            }
        } else {
            handleWrong();
        }
    }
});

// ゲーム開始
updateDisplay();
startTimer();