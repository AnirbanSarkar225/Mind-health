document.addEventListener('DOMContentLoaded', () => {
    // Basic interaction for appointment steps
    const formControls = document.querySelectorAll('.appointment-form .form-control');
    const steps = document.querySelectorAll('.process-steps .step');

    formControls.forEach((control, index) => {
        control.addEventListener('change', () => {
            // Activate the next step when a select changes
            if (control.value && control.value !== control.options[0].text) {
                if (index + 1 < steps.length) {
                    steps[index + 1].classList.add('active');
                }
            }
        });
    });

    // Form submission mock
    const form = document.querySelector('.appointment-form');
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const btn = form.querySelector('.btn-primary');
        const originalText = btn.innerHTML;
        
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing...';
        btn.style.opacity = '0.8';

        setTimeout(() => {
            btn.innerHTML = '<i class="fa-solid fa-check"></i> Appointment Confirmed';
            btn.style.backgroundColor = '#10B981';
            btn.style.color = 'white';
            
            // Mark all steps active
            steps.forEach(step => step.classList.add('active'));

            setTimeout(() => {
                btn.innerHTML = originalText;
                btn.style.backgroundColor = '';
                btn.style.color = '';
                // Reset form and steps
                form.reset();
                steps.forEach((step, i) => {
                    if(i > 0) step.classList.remove('active');
                });
            }, 3000);
        }, 1500);
    });

    // Video play button hover effect
    const playBtn = document.querySelector('.play-btn');
    const cardOverlay = document.querySelector('.card-overlay');

    if(cardOverlay && playBtn) {
        cardOverlay.addEventListener('mouseenter', () => {
            playBtn.style.transform = 'scale(1.1)';
            playBtn.style.transition = 'transform 0.3s ease';
        });
        cardOverlay.addEventListener('mouseleave', () => {
            playBtn.style.transform = 'scale(1)';
        });
    }
});
