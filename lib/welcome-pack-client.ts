export function triggerWelcomePackDownload(downloadUrl: string) {
  const frame = document.createElement("iframe");
  frame.src = downloadUrl;
  frame.hidden = true;
  frame.setAttribute("aria-hidden", "true");

  document.body.append(frame);

  window.setTimeout(() => {
    frame.remove();
  }, 60_000);
}

export function redirectAfterDownloadStarts(redirectTo: string) {
  window.setTimeout(() => {
    window.location.href = redirectTo;
  }, 600);
}
