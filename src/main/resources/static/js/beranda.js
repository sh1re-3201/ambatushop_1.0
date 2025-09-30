// tiny interaction: toggle sidebar close and highlight active menu
document.addEventListener('DOMContentLoaded', ()=>{

  // close sidebar button toggles a compact class (for mobile or narrow view)
  const closeBtn = document.querySelector('.close-sidebar');
  const sidebar = document.querySelector('.sidebar');
  closeBtn?.addEventListener('click', ()=>{
    sidebar.classList.toggle('closed');
    if (sidebar.classList.contains('closed')) {
      sidebar.style.transform = 'translateX(-16px) scale(0.98)';
      sidebar.style.opacity = '0.9';
    } else {
      sidebar.style.transform = '';
      sidebar.style.opacity = '';
    }
  });

  // menu active state
  document.querySelectorAll('.menu-item').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      document.querySelectorAll('.menu-item').forEach(x=>x.classList.remove('active'));
      btn.classList.add('active');
    });
  });

});