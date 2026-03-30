// hoangsa_truongsa.js - Load và xử lý dữ liệu Hoàng Sa - Trường Sa
let hoangSaTruongSaLayer = null;
let hoangSaTruongSaData = null;
let hoangSaTruongSaLabels = [];

// Hàm load và hiển thị Hoàng Sa - Trường Sa
function loadHoangSaTruongSa() {
    // Xóa layer cũ nếu có
    if (hoangSaTruongSaLayer) {
        map.removeLayer(hoangSaTruongSaLayer);
    }
    
    // Xóa các nhãn cũ
    hoangSaTruongSaLabels.forEach(label => {
        map.removeLayer(label);
    });
    hoangSaTruongSaLabels = [];

    // Load file JSON
    fetch('HoangSa_TruongSa.json')
        .then(response => response.json())
        .then(data => {
            hoangSaTruongSaData = data;
            
            // Tạo style cho các feature
            function style(feature) {
                return {
                    fillColor: '#ffffffff',
                    weight: 2,
                    opacity: 1,
                    color: '#ffffffff',
                    dashArray: '5',
                    fillOpacity: 0.5
                };
            }

            // Tạo popup cho mỗi feature
            function onEachFeature(feature, layer) {
                if (feature.properties) {
                    // Popup bị vô hiệu hóa
                    let popupContent = '<div style="max-width: 300px;"></div>';
                    // layer.bindPopup(popupContent); // Đã loại bỏ

                    // Tooltip bị ẩn
                    // let tooltipText = feature.properties.ten_xa ||
                    //                    feature.properties.name || 
                    //                    feature.properties.Name || 
                    //                    'QĐ. Hoàng Sa';
                    
                    // if (tooltipText && !tooltipText.startsWith('QĐ.')) {
                    //     tooltipText = 'QĐ. ' + tooltipText;
                    // }
                    
                    // layer.bindTooltip(tooltipText, {
                    //     permanent: true,
                    //     direction: 'center',
                    //     className: 'hoangsa-label'
                    // });
                }

                // Highlight khi hover
                layer.on({
                    mouseover: function(e) {
                        const layer = e.target;
                        layer.setStyle({
                            weight: 3,
                            color: '#ffffffff',
                            fillOpacity: 0.8
                        });
                        if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
                            layer.bringToFront();
                        }
                    },
                    mouseout: function(e) {
                        hoangSaTruongSaLayer.resetStyle(e.target);
                    },
                    click: function(e) {
                        map.fitBounds(e.target.getBounds());
                    }
                });
            }

            // Tạo GeoJSON layer
            hoangSaTruongSaLayer = L.geoJSON(data, {
                style: style,
                onEachFeature: onEachFeature
            }).addTo(map);
            
            // Thêm nhãn cho quần đảo
            const labelIcon = L.divIcon({
                className: 'hoangsa-label-marker',
                html: '<div class="hoangsa-label-text">quần đảo Trường Sa (Việt Nam)</div>',
                iconSize: null,
                iconAnchor: null
            });
            
            const truongSaLabelIcon = L.divIcon({
                className: 'truongsa-label-marker',
                html: '<div class="truongsa-label-text">quần đảo<br>Hoàng Sa (Việt Nam)</div>',
                iconSize: null,
                iconAnchor: null
            });
            
            // Thêm nhãn Hoàng Sa
            const hoangSaLabel = L.marker([10.738896522211295, 115.8650541557405], {
                icon: labelIcon,
                interactive: false
            }).addTo(map);
            hoangSaTruongSaLabels.push(hoangSaLabel);
            
            // Thêm nhãn Trường Sa
            const truongSaLabel = L.marker([16.661891524365267, 112.68687418302326], {
                icon: truongSaLabelIcon,
                interactive: false
            }).addTo(map);
            hoangSaTruongSaLabels.push(truongSaLabel);

            updateInfo('Đã hiển thị dữ liệu Hoàng Sa - Trường Sa');
        })
        .catch(error => {
            console.error('Lỗi khi load dữ liệu Hoàng Sa - Trường Sa:', error);
            updateInfo('Lỗi khi tải dữ liệu Hoàng Sa - Trường Sa');
        });
}

// Hàm toggle hiển thị Hoàng Sa - Trường Sa
function toggleHoangSaTruongSa() {
    if (hoangSaTruongSaLayer) {
        if (map.hasLayer(hoangSaTruongSaLayer)) {
            map.removeLayer(hoangSaTruongSaLayer);
            updateInfo('Đã ẩn dữ liệu Hoàng Sa - Trường Sa');
        } else {
            map.addLayer(hoangSaTruongSaLayer);
            updateInfo('Đã hiển thị dữ liệu Hoàng Sa - Trường Sa');
        }
    } else {
        loadHoangSaTruongSa();
    }
}

// Thêm event listener cho nút toggle
// document.getElementById('btnToggleHoangSaTruongSa').addEventListener('click', toggleHoangSaTruongSa);

// Export các biến và hàm
window.hoangSaTruongSaLayer = hoangSaTruongSaLayer;
window.hoangSaTruongSaData = hoangSaTruongSaData;
window.hoangSaTruongSaLabels = hoangSaTruongSaLabels;
window.loadHoangSaTruongSa = loadHoangSaTruongSa;
window.toggleHoangSaTruongSa = toggleHoangSaTruongSa;

// Load Hoàng Sa - Trường Sa mặc định khi trang load
loadHoangSaTruongSa();
