import Link from 'next/link';

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-xl shadow p-8 w-full max-w-sm text-center">
        <div className="text-5xl mb-4">📧</div>
        <h1 className="text-xl font-bold text-gray-800 mb-2">メールを確認してください</h1>
        <p className="text-sm text-gray-500 mb-6">
          ご登録のメールアドレスに認証リンクを送信しました。
          メール内のリンクをクリックして登録を完了してください。
        </p>
        <p className="text-xs text-gray-400 mb-6">
          メールが届かない場合は迷惑メールフォルダをご確認ください。
        </p>
        <Link href="/login" className="text-sm text-blue-600 hover:underline">
          ログインページに戻る
        </Link>
      </div>
    </div>
  );
}
