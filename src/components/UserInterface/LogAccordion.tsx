import {
  CheckCircleOutline,
  ExpandMore,
  PlaceOutlined,
} from '@mui/icons-material';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Stack,
  Typography,
} from '@mui/material';

interface LandmarkItem {
  color: string;
  name: string;
  position: {
    x: number;
    y: number;
    z: number;
  };
}

interface LogAccordionProps<T> {
  title: string;
  data: Record<string, T> | LandmarkItem[];
  isArray?: boolean;
  isLandmarkArray?: boolean; // 👈 new prop for array of objects
}

export const LogAccordion = <T extends number | number[]>({
  title,
  data,
  isArray = false,
  isLandmarkArray = false,
}: LogAccordionProps<T>) => {
  return (
    <Accordion
      disableGutters
      defaultExpanded
      sx={{
        backgroundColor: '#f9f9ff',
        borderRadius: 1,
        boxShadow: 'none',
        mt: 1,
      }}>
      <AccordionSummary
        expandIcon={<ExpandMore />}
        sx={{
          '&:hover': { backgroundColor: '#f1f3ff' },
        }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <CheckCircleOutline sx={{ color: '#1976d2' }} />
          <Typography
            fontWeight="bold"
            color="#2c3e50"
            sx={{ fontSize: '1rem' }}>
            {title}
          </Typography>
        </Stack>
      </AccordionSummary>

      <AccordionDetails sx={{ pl: 2, pr: 2 }}>
        {isLandmarkArray
          ? // 🎯 Handle landmark array data
            (data as LandmarkItem[]).map((item) => (
              <Accordion
                key={item.name}
                disableGutters
                defaultExpanded
                sx={{
                  backgroundColor: '#fff',
                  border: '1px solid #e0e0e0',
                  borderRadius: 1,
                  boxShadow: 'none',
                  mb: 1,
                }}>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <PlaceOutlined
                      sx={{ color: item.color, fontSize: '1.2rem' }}
                    />
                    <Box
                      sx={{
                        backgroundColor: item.color,
                        border: '1px solid #ccc',
                        borderRadius: '50%',
                        height: 12,
                        width: 12,
                      }}
                    />
                    <Typography fontWeight="500" sx={{ fontSize: '0.95rem' }}>
                      {item.name
                        .replaceAll('_', ' ')
                        .replace(/\b\w/g, (char) => char.toUpperCase())}{' '}
                      <Typography
                        component="span"
                        sx={{
                          color: '#777',
                          fontSize: '0.8rem',
                          ml: 0.5,
                        }}>
                        ({item.color})
                      </Typography>
                    </Typography>
                  </Stack>
                </AccordionSummary>

                <AccordionDetails>
                  <Typography
                    sx={{
                      color: '#333',
                      fontSize: '0.85rem',
                      pl: 1,
                    }}>
                    X: {item.position?.x?.toFixed(4)} <br />
                    Y: {item.position?.y?.toFixed(4)} <br />
                    Z: {item.position?.z?.toFixed(4)}
                  </Typography>
                </AccordionDetails>
              </Accordion>
            ))
          : // 🧮 Handle Record data (like your measurements)
            Object.entries(data).map(([key, value]) => (
              <Accordion
                key={key}
                defaultExpanded
                disableGutters
                sx={{
                  backgroundColor: '#fff',
                  border: '1px solid #e0e0e0',
                  borderRadius: 1,
                  boxShadow: 'none',
                  mb: 1,
                }}>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <PlaceOutlined
                      sx={{ color: '#1976d2', fontSize: '1.2rem' }}
                    />
                    <Typography fontWeight="500" sx={{ fontSize: '0.95rem' }}>
                      {key
                        .replaceAll('_', ' ')
                        .replace(/\b\w/g, (char) => char.toUpperCase())}
                    </Typography>
                  </Stack>
                </AccordionSummary>

                <AccordionDetails>
                  {isArray ? (
                    <Typography
                      sx={{
                        color: '#333',
                        fontSize: '0.85rem',
                        pl: 1,
                      }}>
                      {Array.isArray(value) && value.length >= 3 ? (
                        <>
                          X: {value[0].toFixed(4)} <br />
                          Y: {value[1].toFixed(4)} <br />
                          Z: {value[2].toFixed(4)}
                        </>
                      ) : (
                        'Invalid data'
                      )}
                    </Typography>
                  ) : (
                    <Typography
                      sx={{
                        color: '#333',
                        fontSize: '0.85rem',
                        pl: 1,
                      }}>
                      {`${value?.toFixed(2)} cm (${((value as number) * 0.393701).toFixed(2)} inches)`}
                    </Typography>
                  )}
                </AccordionDetails>
              </Accordion>
            ))}
      </AccordionDetails>
    </Accordion>
  );
};
