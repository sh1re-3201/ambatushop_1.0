document.addEventListener('DOMContentLoaded', () => {

    const profilBtn = document.getElementById('profile-btn')


    // Profile button
    profilBtn?.addEventListener('click', () => {
        window.location.href = '/menu_profile.html';
    });
})