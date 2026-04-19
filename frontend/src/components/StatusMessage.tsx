type StatusMessageProps = {
  tone: "error" | "info" | "success";
  title: string;
  message: string;
};

export function StatusMessage({ tone, title, message }: StatusMessageProps) {
  return (
    <div className={`status-message status-${tone}`}>
      <strong>{title}</strong>
      <p>{message}</p>
    </div>
  );
}
