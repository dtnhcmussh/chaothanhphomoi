// map.js - Khởi tạo bản đồ và các lớp bản đồ
// Giới hạn thao tác trong khu vực TP.HCM
const lockedMapBounds = L.latLngBounds(
    [8.40, 106.20],
    [11.80, 107.95]
);

// Khởi tạo bản đồ - Tọa độ mặc định: Thành phố Hồ Chí Minh
const map = L.map('map', {
    maxBounds: lockedMapBounds,
    maxBoundsViscosity: 1.0,
    minZoom: 9,
    maxZoom: 19
}).setView([10.90, 106.95], 9);

// Tạo custom panes để quản lý z-index của các lớp
// Pane cho GeoJSON boundary layer (dưới)
const geoJsonPane = map.createPane('geoJsonPane');
geoJsonPane.style.zIndex = 450;

// Pane cho Truso layer (trên top)
const trusoPane = map.createPane('trusoPane');
trusoPane.style.zIndex = 650;

// Thêm lớp bản đồ Satellite (CartoDB)
const satelliteLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    attribution: '© OpenStreetMap contributors © CARTO',
    maxZoom: 19
});

// Thêm lớp nền vệ tinh mới (Esri World Imagery)
const esriSatelliteLayer = L.tileLayer('https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles © Esri – Esri World Imagery',
    maxZoom: 19,
    layerName: 'Esri World Imagery'
});

// Thêm lớp mặc định: Satellite (CartoDB)
satelliteLayer.addTo(map);

// Thêm Scale control (thanh tỷ lệ)
L.control.scale({
    position: 'bottomleft',
    metric: true,
    imperial: false
}).addTo(map);

// Tạo element hiển thị tọa độ
const coordinateDisplay = L.control({position: 'bottomleft'});
coordinateDisplay.onAdd = function(map) {
    const div = L.DomUtil.create('div', 'coordinate-display');
    div.innerHTML = '<div id="coordinates">Tọa độ: 0.000000 - 0.000000</div>';
    L.DomEvent.disableClickPropagation(div);
    return div;
};
coordinateDisplay.addTo(map);

// Lưu trữ các lớp bản đồ
const baseLayers = {
    "Satellite (CartoDB)": satelliteLayer,
    "Bản đồ vệ tinh (Esri)": esriSatelliteLayer
};

// Lưu trữ các điểm đánh dấu
let markers = [];
let markerGroup = L.layerGroup().addTo(map);

// Zoom bản đồ để hiển thị toàn bộ dữ liệu hiện có (GeoJSON + Trụ sở)
function fitMapToAllData(options = {}) {
    const combinedBounds = L.latLngBounds([]);

    const geoLayer = window.geoJsonLayer;
    if (geoLayer && typeof geoLayer.getBounds === 'function') {
        const geoBounds = geoLayer.getBounds();
        if (geoBounds && geoBounds.isValid()) {
            combinedBounds.extend(geoBounds);
        }
    }

    const officesLayer = window.trusoLayer;
    if (officesLayer && typeof officesLayer.getBounds === 'function') {
        const officeBounds = officesLayer.getBounds();
        if (officeBounds && officeBounds.isValid()) {
            combinedBounds.extend(officeBounds);
        }
    }

    if (combinedBounds.isValid()) {
        map.fitBounds(combinedBounds.pad(0.12), {
            padding: [20, 20],
            maxZoom: 10,
            ...options
        });
    } else {
        map.fitBounds(lockedMapBounds, {
            padding: [20, 20],
            maxZoom: 8,
            ...options
        });
    }
}

// Đảm bảo khi vào trang/reload sẽ thấy toàn bộ dữ liệu
window.addEventListener('load', function() {
    setTimeout(function() {
        fitMapToAllData();
    }, 400);
});

// Xử lý sự kiện mousemove để cập nhật tọa độ
map.on('mousemove', function(e) {
    const lat = e.latlng.lat;
    const lng = e.latlng.lng;
    
    // Cập nhật hiển thị tọa độ
    document.getElementById('coordinates').textContent = `Tọa độ: ${lat.toFixed(6)} - ${lng.toFixed(6)}`;
});

// Xử lý sự kiện click trên bản đồ
map.on('click', function(e) {
    const lat = e.latlng.lat;
    const lng = e.latlng.lng;

    // Cập nhật thông tin
    updateInfo(`Tọa độ: ${lat.toFixed(6)}, ${lng.toFixed(6)}`);

    // Đã bỏ tính năng thêm điểm đánh dấu
});

// Hàm thêm điểm đánh dấu
function addMarker(lat, lng, title = 'Điểm đánh dấu') {
    const marker = L.marker([lat, lng])
        .addTo(markerGroup)
        .bindPopup(`
            <strong>${title}</strong><br>
            Tọa độ: ${lat.toFixed(6)}, ${lng.toFixed(6)}
        `)
        .openPopup();

    markers.push(marker);
    return marker;
}

// Hàm xóa tất cả điểm đánh dấu
function clearMarkers() {
    markerGroup.clearLayers();
    markers = [];
    updateInfo('Đã xóa tất cả điểm đánh dấu');
}

// Hàm chuyển đổi lớp bản đồ
let currentLayerIndex = 0;
const layerNames = Object.keys(baseLayers);

function toggleLayer() {
    // Xóa lớp hiện tại
    map.eachLayer(function(layer) {
        if (layer instanceof L.TileLayer) {
            map.removeLayer(layer);
        }
    });

    // Thêm lớp tiếp theo
    currentLayerIndex = (currentLayerIndex + 1) % layerNames.length;
    const nextLayerName = layerNames[currentLayerIndex];
    baseLayers[nextLayerName].addTo(map);

    updateInfo(`Đã chuyển sang: ${nextLayerName}`);
}

// Thêm event listener cho nút toggle layer (tương thích ngược)
document.addEventListener('DOMContentLoaded', function() {
    const btnToggleLayer = document.getElementById('btnToggleLayer');
    if (btnToggleLayer) {
        btnToggleLayer.addEventListener('click', toggleLayer);
    }
});

// Các nút điều khiển theo phong cách Esri
const btnEsriSearch = document.getElementById('btnEsriSearch');
const btnEsriLocate = document.getElementById('btnEsriLocate');
const btnEsriLayer = document.getElementById('btnEsriLayer');
const btnToggleGeoJSON = document.getElementById('btnToggleGeoJSON');
const searchPanel = document.getElementById('searchPanel');
const searchInput = document.getElementById('searchInput');
const btnSearch = document.getElementById('btnSearch');
const btnClearSearch = document.getElementById('btnClearSearch');

// Hàm toggle search panel
function toggleSearchPanel() {
    if (searchPanel) {
        searchPanel.classList.toggle('active');
        if (searchPanel.classList.contains('active')) {
            searchInput.focus();
        }
    }
}

// Handler cho nút search
if (btnEsriSearch) {
    btnEsriSearch.addEventListener('click', () => {
        toggleSearchPanel();
    });
}

// Handler cho nút tìm kiếm trong search panel
if (btnSearch) {
    btnSearch.addEventListener('click', () => {
        const searchTerm = searchInput.value.trim();
        if (searchTerm) {
            // Thực hiện tìm kiếm - sẽ được xử lý bởi search.js
            performSearch(searchTerm);
        }
    });
}

// Handler cho nút xóa tìm kiếm
if (btnClearSearch) {
    btnClearSearch.addEventListener('click', () => {
        searchInput.value = '';
        searchInput.focus();
        clearSearchResults();
    });
}

// Close search panel khi click ra ngoài
document.addEventListener('click', function(event) {
    if (searchPanel && searchPanel.classList.contains('active')) {
        if (!searchPanel.contains(event.target) && !btnEsriSearch.contains(event.target)) {
            searchPanel.classList.remove('active');
        }
    }
});

if (btnEsriLocate) {
    btnEsriLocate.addEventListener('click', () => {
        map.locate({setView: true, maxZoom: 16});
    });
}

if (btnEsriLayer) {
    btnEsriLayer.addEventListener('click', toggleLayer);
}

// Event listener para o botão de ranh giới (GeoJSON)
document.addEventListener('DOMContentLoaded', function() {
    const btnToggleGeoJSONEl = document.getElementById('btnToggleGeoJSON');
    if (btnToggleGeoJSONEl) {
        btnToggleGeoJSONEl.addEventListener('click', function() {
            console.log('Ranh giới button clicked');
            const btn = this;
            const iconSpan = btn.querySelector('.esri-icon-checkbox-unchecked, .esri-icon-checkbox-checked');
            
            // Chamar a função de toggle e obter o novo estado
            if (typeof toggleGeoJSON === 'function') {
                const isNowVisible = toggleGeoJSON();
                
                // Atualizar estado visual do botão e ícone com base no valor retornado
                if (isNowVisible) {
                    btn.classList.add('active');
                    if (iconSpan) {
                        iconSpan.classList.remove('esri-icon-checkbox-unchecked');
                        iconSpan.classList.add('esri-icon-checkbox-checked');
                    }
                    console.log('Button marked as active - GeoJSON is now visible');
                } else {
                    btn.classList.remove('active');
                    if (iconSpan) {
                        iconSpan.classList.remove('esri-icon-checkbox-checked');
                        iconSpan.classList.add('esri-icon-checkbox-unchecked');
                    }
                    console.log('Active state removed - GeoJSON is now hidden');
                }
            } else {
                console.error('toggleGeoJSON function not found');
                updateInfo('Erro: Função toggleGeoJSON não encontrada');
            }
        });
    } else {
        console.error('btnToggleGeoJSON element not found');
    }

    // Event listener cho nút toggle Truso layer
    const btnToggleTrusoEl = document.getElementById('btnToggleTruso');
    if (btnToggleTrusoEl) {
        btnToggleTrusoEl.addEventListener('click', function() {
            console.log('Truso button clicked');
            const btn = this;
            const iconSpan = btn.querySelector('.esri-icon-checkbox-unchecked, .esri-icon-checkbox-checked');
            
            // Gọi hàm toggle và lấy trạng thái mới
            if (typeof toggleTrusoLayer === 'function') {
                const isNowVisible = toggleTrusoLayer();
                
                // Cập nhật trạng thái hiển thị của button
                if (isNowVisible) {
                    btn.classList.add('active');
                    if (iconSpan) {
                        iconSpan.classList.remove('esri-icon-checkbox-unchecked');
                        iconSpan.classList.add('esri-icon-checkbox-checked');
                    }
                    console.log('Truso button marked as active - layer is now visible');
                } else {
                    btn.classList.remove('active');
                    if (iconSpan) {
                        iconSpan.classList.remove('esri-icon-checkbox-checked');
                        iconSpan.classList.add('esri-icon-checkbox-unchecked');
                    }
                    console.log('Truso button active state removed - layer is now hidden');
                }
            } else {
                console.error('toggleTrusoLayer function not found');
                updateInfo('Lỗi: Hàm toggleTrusoLayer không được tìm thấy');
            }
        });
    } else {
        console.error('btnToggleTruso element not found');
    }
});

// Hiển thị thông tin ban đầu
updateInfo('Nhấp vào bản đồ để xem tọa độ. Sử dụng các nút để điều khiển.');

// ===== SIDEBAR ACTION BUTTONS =====

// Hàm xuất bản đồ dạng PNG
function exportMapAsPNG() {
    // Kiểm tra nếu html2canvas có sẵn
    if (typeof html2canvas === 'undefined') {
        // Tải html2canvas từ CDN
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
        script.onload = function() {
            captureMap();
        };
        document.head.appendChild(script);
    } else {
        captureMap();
    }
}

function captureMap() {
    const mapContainer = document.getElementById('map');
    
    html2canvas(mapContainer, {
        backgroundColor: '#fff',
        scale: 2,
        useCORS: true,
        logging: false
    }).then(canvas => {
        // Tạo link để tải file
        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/png');
        link.download = `ban-do-hcm-${new Date().toISOString().split('T')[0]}.png`;
        link.click();
        
        updateInfo('Đã xuất bản đồ thành công!');
    }).catch(err => {
        console.error('Lỗi xuất bản đồ:', err);
        updateInfo('Lỗi: Không thể xuất bản đồ. Vui lòng thử lại.');
    });
}

// Hàm đặt lại bản đồ
function resetMap() {
    // Xóa highlight
    if (typeof clearHighlight === 'function') {
        clearHighlight();
    }
    
    // Xóa tìm kiếm
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.value = '';
    }
    
    // Xóa tất cả markers
    if (typeof clearMarkers === 'function') {
        clearMarkers();
    }
    
    // Zoom về vị trí mặc định
    map.setView([10.8231, 106.6297], 13);
    
    updateInfo('Đã đặt lại bản đồ về vị trí mặc định.');
}

// Hàm xóa tất cả lựa chọn
function clearSelection() {
    // Xóa highlight
    if (typeof clearHighlight === 'function') {
        clearHighlight();
    }
    
    // Xóa tìm kiếm
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.value = '';
    }
    
    // Xóa tất cả markers
    if (typeof clearMarkers === 'function') {
        clearMarkers();
    }
    
    // Ẩn dropdown tìm kiếm
    if (typeof hideSearchDropdown === 'function') {
        hideSearchDropdown();
    }
    
    // Ẩn search panel
    const searchPanel = document.getElementById('searchPanel');
    if (searchPanel) {
        searchPanel.classList.remove('active');
    }
    
    updateInfo('Đã xóa tất cả lựa chọn.');
}

// Thêm event listeners cho sidebar action buttons
document.addEventListener('DOMContentLoaded', function() {
    const btnExportPNG = document.getElementById('btnExportPNG');
    const btnResetMap = document.getElementById('btnResetMap');
    const btnClearSelection = document.getElementById('btnClearSelection');
    
    if (btnExportPNG) {
        btnExportPNG.addEventListener('click', exportMapAsPNG);
    }
    
    if (btnResetMap) {
        btnResetMap.addEventListener('click', resetMap);
    }
    
    if (btnClearSelection) {
        btnClearSelection.addEventListener('click', clearSelection);
    }
});

// Export các biến và hàm cần thiết
window.map = map;
window.baseLayers = baseLayers;
window.markers = markers;
window.markerGroup = markerGroup;
window.addMarker = addMarker;
window.clearMarkers = clearMarkers;
window.toggleLayer = toggleLayer;
window.exportMapAsPNG = exportMapAsPNG;
window.resetMap = resetMap;
window.clearSelection = clearSelection;
window.fitMapToAllData = fitMapToAllData;
