interface Props
  extends Omit<
    React.DetailedHTMLProps<
      React.InputHTMLAttributes<HTMLInputElement>,
      HTMLInputElement
    >,
    'file' | 'id'
  > {
  title?: string;
  description?: string;
  file?: File | null;
  onDelete?: () => void;
  loading?: boolean;
}

export default function FileDropzone(props: Props) {
  const { name, title, description, file, onDelete, loading, ...restProps } =
    props;

  if (!file)
    return (
      <label
        htmlFor={name}
        className="mx-auto flex w-full max-w-lg cursor-pointer flex-col items-center rounded-xl border-2 border-dashed border-primary bg-white p-6 text-center dark:bg-zinc-800"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          className="fill-primary "
          width={35}
          height={35}
        >
          <path d="M12 12.5858L16.2426 16.8284L14.8284 18.2426L13 16.415V22H11V16.413L9.17157 18.2426L7.75736 16.8284L12 12.5858ZM12 2C15.5934 2 18.5544 4.70761 18.9541 8.19395C21.2858 8.83154 23 10.9656 23 13.5C23 16.3688 20.8036 18.7246 18.0006 18.9776L18.0009 16.9644C19.6966 16.7214 21 15.2629 21 13.5C21 11.567 19.433 10 17.5 10C17.2912 10 17.0867 10.0183 16.8887 10.054C16.9616 9.7142 17 9.36158 17 9C17 6.23858 14.7614 4 12 4C9.23858 4 7 6.23858 7 9C7 9.36158 7.03838 9.7142 7.11205 10.0533C6.91331 10.0183 6.70879 10 6.5 10C4.567 10 3 11.567 3 13.5C3 15.2003 4.21241 16.6174 5.81986 16.934L6.00005 16.9646L6.00039 18.9776C3.19696 18.7252 1 16.3692 1 13.5C1 10.9656 2.71424 8.83154 5.04648 8.19411C5.44561 4.70761 8.40661 2 12 2Z"></path>
        </svg>

        <h2 className="mt-4 text-xl font-medium tracking-wide">{title}</h2>

        <p className="mt-2 tracking-wide ">{description}</p>

        <input
          id={name}
          name={name}
          type="file"
          className="hidden"
          {...restProps}
        />
      </label>
    );

  return (
    <>
      <div
        className="mx-auto flex w-full max-w-lg cursor-pointer flex-col items-center rounded-xl border-2 border-dashed border-primary bg-white p-6 text-center dark:bg-zinc-800"
        onClick={(e) => {
          if (onDelete) return onDelete();
        }}
      >
        {!loading ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            className="fill-primary"
            width={35}
            height={35}
          >
            <path d="M17 6H22V8H20V21C20 21.5523 19.5523 22 19 22H5C4.44772 22 4 21.5523 4 21V8H2V6H7V3C7 2.44772 7.44772 2 8 2H16C16.5523 2 17 2.44772 17 3V6ZM18 8H6V20H18V8ZM13.4142 13.9997L15.182 15.7675L13.7678 17.1817L12 15.4139L10.2322 17.1817L8.81802 15.7675L10.5858 13.9997L8.81802 12.232L10.2322 10.8178L12 12.5855L13.7678 10.8178L15.182 12.232L13.4142 13.9997ZM9 4V6H15V4H9Z"></path>
          </svg>
        ) : (
          <svg
            width="35"
            height="35"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12,1A11,11,0,1,0,23,12,11,11,0,0,0,12,1Zm0,19a8,8,0,1,1,8-8A8,8,0,0,1,12,20Z"
              opacity=".25"
            />
            <path
              className="spinner_ajPY fill-error"
              d="M10.14,1.16a11,11,0,0,0-9,8.92A1.59,1.59,0,0,0,2.46,12,1.52,1.52,0,0,0,4.11,10.7a8,8,0,0,1,6.66-6.61A1.42,1.42,0,0,0,12,2.69h0A1.57,1.57,0,0,0,10.14,1.16Z"
            />
          </svg>
        )}

        <h2 className="mt-4 text-xl font-medium tracking-wide ">{title}</h2>

        <p className="mt-2 tracking-wide ">{file.name}</p>
      </div>

      <div></div>
    </>
  );
}
