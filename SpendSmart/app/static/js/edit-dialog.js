// Minimal edit dialog controls (no Bootstrap)
(function(){
  window.openEditDialog = function(){
    var overlay = document.getElementById('editOverlay');
    if (overlay) overlay.style.display = 'block';
  };
  window.closeEditDialog = function(){
    var overlay = document.getElementById('editOverlay');
    if (overlay) overlay.style.display = 'none';
  };
})();
