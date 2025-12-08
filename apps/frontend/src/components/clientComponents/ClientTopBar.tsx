function ClientTopBar({
  title,
  subTitle,
  titleClass,
}: {
  title: string;
  subTitle?: string;
  titleClass?: string;
}) {
  return (
    <div>
      <h1
        className={`mb-2 font-bold text-gray-900 ${titleClass || 'text-xl md:text-3xl'}`}
      >
        {title}
      </h1>
      {subTitle && <p className="text-sm text-gray-500 md:text-base">{subTitle}</p>}
    </div>
  );
}

export default ClientTopBar;
