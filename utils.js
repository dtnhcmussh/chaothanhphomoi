// utils.js - Các hàm tiện ích

// Hàm cập nhật thông tin
function updateInfo(message) {
    const infoElement = document.getElementById('info');
    if (infoElement) {
        infoElement.innerHTML = `<p>${message}</p>`;
    }
}

// Hàm toggle sidebar
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const toggleBtnFixed = document.getElementById('sidebarToggleFixed');
    
    sidebar.classList.toggle('collapsed');
    
    // Cập nhật icon/text
    const isCollapsed = sidebar.classList.contains('collapsed');
    const iconText = isCollapsed ? '☰' : '✕';
    const titleText = isCollapsed ? 'Hiển thị thanh bên' : 'Ẩn thanh bên';
    
    if (toggleBtnFixed) {
        toggleBtnFixed.textContent = iconText;
        toggleBtnFixed.title = titleText;
    }
}

// Hàm đóng sidebar
function closeSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.add('collapsed');
    
    const toggleBtnFixed = document.getElementById('sidebarToggleFixed');
    
    if (toggleBtnFixed) {
        toggleBtnFixed.textContent = '☰';
        toggleBtnFixed.title = 'Hiển thị thanh bên';
    }
}

// Hàm mở sidebar
function openSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.remove('collapsed');
    
    const toggleBtnFixed = document.getElementById('sidebarToggleFixed');
    
    if (toggleBtnFixed) {
        toggleBtnFixed.textContent = '✕';
        toggleBtnFixed.title = 'Ẩn thanh bên';
    }
}

// Tự động thêm vùng cuộn cho popup có nội dung dài
function buildScrollablePopupContent(htmlContent, minWords = 150) {
    const plainText = (htmlContent || '')
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    const wordCount = plainText ? plainText.split(' ').length : 0;

    if (wordCount >= minWords) {
        return `<div class="popup-scroll-content">${htmlContent}</div>`;
    }

    return htmlContent;
}

// Thêm event listener cho sidebar toggle
document.addEventListener('DOMContentLoaded', function() {
    const sidebarToggleFixed = document.getElementById('sidebarToggleFixed');
    
    // Event listener cho nút toggle fixed
    if (sidebarToggleFixed) {
        sidebarToggleFixed.addEventListener('click', toggleSidebar);
    }
    
    // Event listener cho nút refresh
    const btnRefresh = document.getElementById('btnRefresh');
    if (btnRefresh) {
        btnRefresh.addEventListener('click', function() {
            // Thêm class spinning cho animation
            const icon = this.querySelector('.esri-icon-refresh');
            if (icon) {
                icon.classList.add('spinning');
            }
            
            // Tải lại trang sau 500ms
            setTimeout(function() {
                location.reload();
            }, 500);
        });
    }
});

// Export hàm
window.updateInfo = updateInfo;
window.toggleSidebar = toggleSidebar;
window.closeSidebar = closeSidebar;
window.openSidebar = openSidebar;
window.buildScrollablePopupContent = buildScrollablePopupContent;