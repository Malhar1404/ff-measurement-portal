import { observer } from 'mobx-react-lite';
import { useContext } from 'react';

import { MainContext } from '../../hooks/useMainContext';


export const SkirtTypeSelector = observer(() => {
    const stateManager = useContext(MainContext);

    return (
      <div
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          border: '1px solid #444',
          borderRadius: '6px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          padding: '12px',
        }}>
        {/* 🔥 Visibility Checkbox */}
        <div
          style={{
            alignItems: 'center',
            borderBottom: '1px solid #555',
            display: 'flex',
            paddingBottom: '8px',
          }}>
          <label
            style={{
              alignItems: 'center',
              color: '#fff',
              cursor: 'pointer',
              display: 'flex',
              fontSize: '14px',
              fontWeight: 'bold',
              gap: '8px',
              marginRight: '16px',
            }}>
            <input
              type="checkbox"
              checked={stateManager.viewManager.isSkirtVisible}
              onChange={(e) =>
                stateManager.viewManager.setIsSkirtVisible(e.target.checked)
              }
              style={{ cursor: 'pointer' }}
            />
            <span>Show Skirt</span>
          </label>

          {/* 🔥 Transform Controls Checkbox */}
          <label
            style={{
              alignItems: 'center',
              color: stateManager.viewManager.isSkirtVisible ? '#fff' : '#888',
              cursor: stateManager.viewManager.isSkirtVisible
                ? 'pointer'
                : 'not-allowed',
              display: 'flex',
              fontSize: '14px',
              fontWeight: 'bold',
              gap: '8px',
            }}>
            <input
              type="checkbox"
              checked={stateManager.viewManager.isSkirtTransformVisible}
              disabled={!stateManager.viewManager.isSkirtVisible}
              onChange={(e) =>
                stateManager.viewManager.setIsSkirtTransformVisible(
                  e.target.checked,
                )
              }
              style={{
                cursor: stateManager.viewManager.isSkirtVisible
                  ? 'pointer'
                  : 'not-allowed',
              }}
            />
            <span>Move Skirt</span>
          </label>
        </div>

        {/* Skirt Type Radio Buttons */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            opacity: stateManager.viewManager.isSkirtVisible ? 1 : 0.5,
            pointerEvents: stateManager.viewManager.isSkirtVisible
              ? 'auto'
              : 'none',
          }}>
          {/* Allstar Skirt */}
          <label
            style={{
              alignItems: 'center',
              color: '#fff',
              cursor: 'pointer',
              display: 'flex',
              fontSize: '14px',
              gap: '8px',
            }}>
            <input
              type="radio"
              name="skirt-type"
              value="allstar_skirt_end"
              checked={stateManager.skirtStore.activeSkirtType === 'allstar_skirt_end'}
              onChange={() => stateManager.skirtStore.setActiveSkirtType('allstar_skirt_end')}
              style={{ cursor: 'pointer' }}
              disabled={!stateManager.viewManager.isSkirtVisible}
            />
            <span>Allstar Skirt</span>
          </label>

          {/* School Skirt */}
          <label
            style={{
              alignItems: 'center',
              color: '#fff',
              cursor: 'pointer',
              display: 'flex',
              fontSize: '14px',
              gap: '8px',
            }}>
            <input
              type="radio"
              name="skirt-type"
              value="school_skirt_end"
              checked={stateManager.skirtStore.activeSkirtType === 'school_skirt_end'}
              onChange={() => stateManager.skirtStore.setActiveSkirtType('school_skirt_end')}
              style={{ cursor: 'pointer' }}
              disabled={!stateManager.viewManager.isSkirtVisible}
            />
            <span>School Skirt</span>
          </label>
        </div>
      </div>
    );
  },
);

SkirtTypeSelector.displayName = 'SkirtTypeSelector';
