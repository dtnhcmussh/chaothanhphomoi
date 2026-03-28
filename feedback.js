// feedback.js - Xử lý modal góp ý

// Lấy các element modal
const feedbackModal = document.getElementById('feedbackModal');
const btnFeedback = document.getElementById('btnFeedback');
const btnCancelFeedback = document.getElementById('btnCancelFeedback');
const modalClose = document.querySelector('.modal-close');
const feedbackForm = document.getElementById('feedbackForm');

// Mở modal khi click nút Góp ý
btnFeedback.addEventListener('click', function() {
    feedbackModal.classList.add('active');
    document.body.style.overflow = 'hidden'; // Ngăn scroll
});

// Đóng modal khi click nút Hủy
btnCancelFeedback.addEventListener('click', function() {
    closeFeedbackModal();
});

// Đóng modal khi click X
modalClose.addEventListener('click', function() {
    closeFeedbackModal();
});

// Đóng modal khi click ngoài modal
window.addEventListener('click', function(event) {
    if (event.target === feedbackModal) {
        closeFeedbackModal();
    }
});

// Hàm đóng modal
function closeFeedbackModal() {
    feedbackModal.classList.remove('active');
    document.body.style.overflow = 'auto'; // Cho phép scroll lại
    feedbackForm.reset(); // Xóa form
}

// Xử lý submit form
feedbackForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Tạo FormData từ form
    const formData = new FormData(feedbackForm);
    
    // Gửi form sử dụng fetch API
    fetch(feedbackForm.action, {
        method: 'POST',
        body: formData
    })
    .then(response => {
        // Hiển thị thông báo thành công
        showSuccessMessage();
        
        // Sau 2 giây, đóng modal và quay lại
        setTimeout(function() {
            closeFeedbackModal();
        }, 2000);
    })
    .catch(error => {
        console.error('Lỗi:', error);
        alert('Có lỗi xảy ra. Vui lòng thử lại!');
    });
});

// Hàm hiển thị thông báo thành công
function showSuccessMessage() {
    // Tạo element thông báo
    const successMessage = document.createElement('div');
    successMessage.classList.add('success-message');
    successMessage.innerHTML = '✓ Góp ý của bạn đã được gửi thành công!';
    
    // Thêm vào modal content
    const modalContent = document.querySelector('.modal-content');
    modalContent.appendChild(successMessage);
    
    // Vô hiệu hóa form
    feedbackForm.style.opacity = '0.5';
    feedbackForm.style.pointerEvents = 'none';
}
