export default function Header() {
  return (
    <header className="relative w-full h-40 bg-[url('/background.png')] bg-cover bg-center flex flex-col justify-center">
      <div className="relative flex flex-col items-center text-primary">
        <h1 className="text-3xl font-bold tracking-wide mt-1">
          Carrinho da Nalva
        </h1>
        <p className="text-sm opacity-80 mt-1 flex items-center gap-1">
          <span>🏖️</span> Curtam a praia <span>🌴</span>
        </p>
      </div>
    </header>
  );
}
