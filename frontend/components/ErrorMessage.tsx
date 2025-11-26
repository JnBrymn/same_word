interface ErrorMessageProps {
  message: string
}

export default function ErrorMessage({ message }: ErrorMessageProps) {
  return (
    <div style={{
      padding: '10px',
      backgroundColor: '#ffebee',
      color: '#c62828',
      borderRadius: '4px',
      marginBottom: '20px'
    }}>
      {message}
    </div>
  )
}

