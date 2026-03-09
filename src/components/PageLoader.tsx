interface PageLoaderProps {
  fullScreen?: boolean;
}

export default function PageLoader({ fullScreen = false }: PageLoaderProps) {
  return (
    <div className={fullScreen ? 'min-h-screen flex items-center justify-center' : 'flex items-center justify-center h-64'}>
      <div className="animate-spin w-8 h-8 border-4 border-wayzen-500 border-t-transparent rounded-full" />
    </div>
  );
}
