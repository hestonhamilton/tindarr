import React, { useState } from 'react';
import { usePlexLibraries } from '../hooks/usePlexLibraries';
import { Library } from '../types';

const CreateRoomPage: React.FC = () => {
  const { data: libraries, isLoading, isError, error } = usePlexLibraries();
  const [selectedLibraries, setSelectedLibraries] = useState<string[]>([]);

  const handleLibraryChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = event.target;
    setSelectedLibraries((prevSelected) =>
      checked
        ? [...prevSelected, value]
        : prevSelected.filter((libraryId) => libraryId !== value)
    );
  };

  if (isLoading) {
    return <div>Loading libraries...</div>;
  }

  if (isError) {
    return <div>Error: {error?.message}</div>;
  }

  return (
    <div>
      <h1>Create New Room</h1>
      <h2>Select Libraries</h2>
      {libraries?.map((library: Library) => (
        <div key={library.key}>
          <input
            type="checkbox"
            id={library.key}
            value={library.key}
            checked={selectedLibraries.includes(library.key)}
            onChange={handleLibraryChange}
          />
          <label htmlFor={library.key}>{library.title}</label>
        </div>
      ))}
      {/* Room creation form will go here */}
    </div>
  );
};

export default CreateRoomPage;

