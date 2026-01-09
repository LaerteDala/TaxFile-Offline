import React, { useState } from 'react';
import RemunerationMapList from './RemunerationMapList';
import RemunerationMapEditor from './RemunerationMapEditor';
import RemunerationMapCreate from './RemunerationMapCreate';

type ViewState = 'list' | 'create' | 'edit';

const RemunerationMap: React.FC = () => {
    const [view, setView] = useState<ViewState>('list');
    const [selectedMapId, setSelectedMapId] = useState<string | null>(null);

    const handleSelectMap = (mapId: string) => {
        setSelectedMapId(mapId);
        setView('edit');
    };

    const handleCreateSuccess = (mapId: string) => {
        setSelectedMapId(mapId);
        setView('edit');
    };

    if (view === 'edit' && selectedMapId) {
        return (
            <RemunerationMapEditor
                mapId={selectedMapId}
                onBack={() => setView('list')}
            />
        );
    }

    if (view === 'create') {
        return (
            <RemunerationMapCreate
                onBack={() => setView('list')}
                onSave={handleCreateSuccess}
            />
        );
    }

    return (
        <RemunerationMapList
            onSelectMap={handleSelectMap}
            onCreate={() => setView('create')}
        />
    );
};

export default RemunerationMap;
