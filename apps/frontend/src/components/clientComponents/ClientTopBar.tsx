function ClientTopBar({ title, subTitle }: { title: string; subTitle?: string }) {
  return (
    <div>
      <h1 className="mb-2 text-3xl font-bold text-gray-900">{title}</h1>
      {subTitle && <p className="text-gray-500">{subTitle}</p>}
    </div>
  );
}

export default ClientTopBar;
