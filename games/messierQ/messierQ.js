document.getElementById('home').addEventListener('click', function () {
    window.location.href = '../../index.html'; // or your desired page
});

document.getElementById('start-game').addEventListener('click', function () {
    // Show all elements with the 'hidden' class
    document.querySelectorAll('.hidden').forEach(el => {
        el.classList.remove('hidden');
        el.classList.add('visible');
    });

    // Hide the start button itself
    this.classList.add('hidden');
});
