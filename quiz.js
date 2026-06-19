// --- 1. 問題データ ---
const quizData = {
    question: "環状線（山手線・大阪環状線）の駅の名前を答えよ！",
    validAnswers: ["東京", "有楽町", "新橋", "浜松町", "田町", "高輪ゲートウェイ", "品川", "大崎", "五反田", "目黒", "恵比寿", "渋谷", "原宿", "代々木", "新宿", "新大久保", "高田馬場", "目白", "池袋", "大塚", "巣鴨", "駒込", "田端", "西日暮里", "日暮里", "鶯谷", "上野", "御徒町", "秋葉原", "神田", "大阪", "天満", "桜ノ宮", "京橋", "大阪城公園", "森ノ宮", "玉造", "鶴橋", "桃谷", "寺田町", "天王寺", "新今宮", "今宮", "芦原橋", "大正", "弁天町", "西九条", "野田", "福島"]
};

// --- 2. ゲームの状態 ---
let currentTurn = 0; // 0〜4
let timeLeft = 30;   // チーム共有の30秒
let timerId = null;
let usedAnswers = []; // 回答済みの駅名
const animals = ['🐻', '🐰', '🦊', '🐿️', '🦉'];

// --- 3. HTML要素の取得 ---
const answerInput = document.getElementById('answer-input');
const fuseBar = document.getElementById('fuse-bar');
const currentTurnLabel = document.getElementById('current-turn-label');
const resultScreen = document.getElementById('result-screen');
const resultTitle = document.getElementById('result-title');
const resultMessage = document.getElementById('result-message');

// 評価ボタン
let likeCount = 0;
let liked = false;
let certified = false;
const btnLike = document.getElementById('btn-like');
const btnCertify = document.getElementById('btn-certify');
const resultAnswer = document.getElementById('result-answer');

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

// --- 4. ゲームの進行 ---
function updateTurn() {
    // 全員のハイライトを解除
    for (let i = 0; i < 5; i++) {
        document.getElementById(`slot-${i}`).classList.remove('active-slot');
    }
    // 現在のターンをハイライト
    if (currentTurn < 5) {
        document.getElementById(`slot-${currentTurn}`).classList.add('active-slot');
        currentTurnLabel.textContent = `📢 いまは ${animals[currentTurn]} ${currentTurn + 1}人目 のターン！`;
    }
}

function startTimer() {
    timerId = setInterval(function() {
        timeLeft--;
        const percentage = (timeLeft / 30) * 100;
        fuseBar.style.width = percentage + '%';

        if (timeLeft <= 0) {
            clearInterval(timerId);
            showResult(false); // 爆発（ゲームオーバー）
        }
    }, 1000);
}

function handleCorrect(answer) {
    // 正解した人の枠を「クリア」状態にする
    const currentSlot = document.getElementById(`slot-${currentTurn}`);
    currentSlot.classList.remove('active-slot');
    currentSlot.classList.add('cleared-slot');
    currentSlot.querySelector('.status-box').textContent = '⭕ 正解';

    usedAnswers.push(answer);
    currentTurn++;

    if (currentTurn >= 5) {
        clearInterval(timerId);
        showResult(true); // 5人正解でクリア
    } else {
        updateTurn();
    }
}

function showResult(isClear) {
    resultScreen.style.display = 'flex';
    if (isClear) {
        resultTitle.textContent = "🎉 ゲームクリア！ 🎉";
        resultMessage.textContent = "5人連続で正解できたよ！すごいチームワーク！";
    } else {
        resultTitle.textContent = "💥 タイムアップ 💥";
        resultMessage.textContent = "時間がなくなって爆弾がバクハツしちゃった…！";
    }
    if (resultAnswer) {
        resultAnswer.textContent = `正解例：${quizData.validAnswers.join('、')}`;
    }
}

// --- 5. 入力イベント ---
answerInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        const val = answerInput.value.trim();
        if (quizData.validAnswers.includes(val) && !usedAnswers.includes(val)) {
            handleCorrect(val);
            answerInput.value = '';
        } else {
            alert('ちがうか、もう誰かが答えたよ！');
            answerInput.value = '';
        }
    }
});

// ゲーム開始
updateTurn();
startTimer();