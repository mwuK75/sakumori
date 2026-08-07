const STORAGE_KEY = 'sakumon-ratings';

function loadQuestionsFromStorage() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    try {
        return JSON.parse(raw);
    } catch (e) {
        return [];
    }
}

function saveQuestionsToStorage(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

async function loadQuestionsForRanking() {
    try {
        const response = await fetch('https://script.google.com/macros/s/AKfycbztQoWbf96IXurDhfTeLqDA3eMbsUu7zEQwQKNjQvZzq9k8hdp4LoopCPsMuW3-z1uuFA/exec');
        if (!response.ok) throw new Error('not found');
        const questions = await response.json();
        const stored = loadQuestionsFromStorage();

        const merged = questions.map(question => {
            const saved = stored.find(item => Number(item.id) === Number(question.id));
            const ratings = saved?.ratings || question.ratings || { fun: 0, useful: 0, difficult: 0 };
            return {
                ...question,
                ratings
            };
        });

        const sorted = [...merged].sort((a, b) => {
            const totalA = (a.ratings?.fun || 0) + (a.ratings?.useful || 0) + (a.ratings?.difficult || 0);
            const totalB = (b.ratings?.fun || 0) + (b.ratings?.useful || 0) + (b.ratings?.difficult || 0);
            return totalB - totalA;
        });

        const rankingList = document.getElementById('ranking-list');
        if (!rankingList) return;

        rankingList.innerHTML = '';
        sorted.slice(0, 5).forEach((item, index) => {
            const total = (item.ratings?.fun || 0) + (item.ratings?.useful || 0) + (item.ratings?.difficult || 0);
            const li = document.createElement('li');
            li.className = 'ranking-item';
            const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
            li.innerHTML = `<strong>${medal} ${item.question}</strong><br>評価数 ${total}`;
            rankingList.appendChild(li);
        });
    } catch (error) {
        console.error(error);
    }
}
const openBtn =
    document.getElementById(
        'open-start-modal'
    );

const modal =
    document.getElementById(
        'start-modal'
    );

const startBtn =
    document.getElementById(
        'start-quiz-btn'
    );

if (openBtn) {

    openBtn.addEventListener(
        'click',
        () => {

            modal.style.display =
                'flex';

        }
    );

}

if (startBtn) {

    startBtn.addEventListener(
        'click',
        () => {

            const playerName =
                document.getElementById(
                    'player-name'
                ).value;

            localStorage.setItem(
                'playerName',
                playerName
            );

            const checked =
                document.querySelectorAll(
                    '.genre-list input:checked'
                );

            const genres = [];

            checked.forEach(item => {

                genres.push(item.value);

            });

            console.log(genres);

            localStorage.setItem(
                'selectedGenres',
                JSON.stringify(genres)
            );

            location.href =
                'quiz.html';

        }
    );

}

loadQuestionsForRanking();
