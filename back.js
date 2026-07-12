function goBack() {
  if (
    document.referrer &&
    document.referrer.startsWith(window.location.origin)
  ) {
    history.back();
  } else {
    window.location.href = "index.html";
  }
}
