import Button from "./Button";

export default function PlyoCard({ exercise, onDone }) {
  return (
    <div className="flex flex-col gap-8 h-full justify-center px-6">
      <div className="text-center">
        <p className="text-accent text-sm uppercase tracking-widest mb-2">Plyometrisk</p>
        <h1 className="text-4xl font-bold">{exercise.name}</h1>
        <p className="text-gray-400 mt-4 text-lg">Påmindelse — udfør sættene, ingen logning.</p>
      </div>
      <Button onClick={onDone}>Færdig</Button>
    </div>
  );
}
