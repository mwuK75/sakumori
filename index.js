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
const closeBtn = document.getElementById('close-start-modal');

if (openBtn) {

    openBtn.addEventListener(
        'click',
        () => {
            const guideLinkRow = document.querySelector('.guide-link-row');

            if (guideLinkRow) {
                guideLinkRow.style.display = 'none';
            }

            modal.style.display = 'flex';
        }
    );

}

if (closeBtn) {
    closeBtn.addEventListener('click', () => {
        const guideLinkRow = document.querySelector('.guide-link-row');

        if (modal) {
            modal.style.display = 'none';
        }
        if (guideLinkRow) {
            guideLinkRow.style.display = 'block';
        }
    });
}

if (startBtn) {

    startBtn.addEventListener(
        'click',
        () => {
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
