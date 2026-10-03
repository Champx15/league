export const proficiencyGroups = [
  {
    id: 'batter',
    label: 'Batter',
    fee: 999,
    options: ['Right Arm Batter', 'Left Arm Batter', 'Top Order', 'Middle Order'],
  },
  {
    id: 'bowler',
    label: 'Bowler',
    fee: 999,
    subgroups: [
      {
        label: 'Fast Bowler',
        options: ['Right Arm Fast Bowler', 'Left Arm Fast Bowler'],
      },
      {
        label: 'Spin Bowler',
        options: [
          'Right Arm Off Break',
          'Right Arm Leg Spin Bowler',
          'Left Arm Orthodox Spin Bowler',
          'Left Arm Chinaman',
        ],
      },
    ],
  },
  {
    id: 'all-rounder',
    label: 'All Rounder',
    fee: 1199,
    options: ['Batting All Rounder', 'Bowling All Rounder'],
  },
  {
    id: 'wicket-keeper',
    label: 'Wicket Keeper',
    fee: 1199,
    options: [],
  },
]
