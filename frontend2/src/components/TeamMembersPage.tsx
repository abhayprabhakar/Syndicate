import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ImageWithFallback } from './figma/ImageWithFallback';

const TeamMembersPage: React.FC = () => {
  const teamMembers = [
    {
      id: 1,
      name: 'B N Shivanth Kumar',
      role: 'Core Member – Institution Innovation Council (IIC)',
      image: 'https://images.unsplash.com/photo-1684919556999-a42d37ffccc1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBwb3J0cmFpdCUyMG1hbGV8ZW58MXx8fHwxNzYxNjUxOTI5fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
    },
    {
      id: 2,
      name: 'Aditya B',
      role: 'ML Associate – Google Developer Group (GDG)',
      image: 'https://images.unsplash.com/photo-1684919556999-a42d37ffccc1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBwb3J0cmFpdCUyMG1hbGV8ZW58MXx8fHwxNzYxNjUxOTI5fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
    },
    {
      id: 3,
      name: 'Abhay P',
      role: 'AI & ML Lead – Google Developer Group (GDG)',
      image: 'https://images.unsplash.com/photo-1684919556999-a42d37ffccc1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBwb3J0cmFpdCUyMG1hbGV8ZW58MXx8fHwxNzYxNjUxOTI5fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
    }
  ];

  const achievements = [
    {
      id: 1,
      image: 'https://images.unsplash.com/photo-1759446334429-bb1f2d1d9f13?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZWFtJTIwYWNoaWV2ZW1lbnQlMjB0cm9waHl8ZW58MXx8fHwxNzYxNzQzOTQ0fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      caption: 'Championship Trophy 2024'
    },
    {
      id: 2,
      image: 'https://images.unsplash.com/photo-1760539619770-f58d0588db9e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZWNobm9sb2d5JTIwaW5ub3ZhdGlvbiUyMGF3YXJkfGVufDF8fHx8MTc2MTc0Mzk0NHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      caption: 'Innovation Award'
    },
    {
      id: 3,
      image: 'https://images.unsplash.com/photo-1759884247144-53d52c31f859?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb2RpbmclMjBoYWNrYXRob24lMjB0ZWFtfGVufDF8fHx8MTc2MTc0Mzk0NXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      caption: 'Hackathon Winners'
    },
    {
      id: 4,
      image: 'https://images.unsplash.com/photo-1761223976272-0d6d4bc38636?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhaSUyMG1hY2hpbmUlMjBsZWFybmluZyUyMGNvbmZlcmVuY2V8ZW58MXx8fHwxNzYxNzQzOTQ1fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      caption: 'ML Conference 2024'
    },
    {
      id: 5,
      image: 'https://images.unsplash.com/photo-1560439514-0fc9d2cd5e1b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkZXZlbG9wZXIlMjBjb21tdW5pdHklMjBldmVudHxlbnwxfHx8fDE3NjE3NDM5NDZ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      caption: 'Community Event'
    },
    {
      id: 6,
      image: 'https://images.unsplash.com/photo-1761223976372-f2324a8e2812?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZWNoJTIwcHJlc2VudGF0aW9uJTIwc3RhZ2V8ZW58MXx8fHwxNzYxNzQzOTQ2fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      caption: 'Tech Presentation'
    },
    {
      id: 7,
      image: 'https://images.unsplash.com/photo-1646579886741-12b59840c63f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b3Jrc2hvcCUyMGNvbGxhYm9yYXRpb24lMjB0ZWNofGVufDF8fHx8MTc2MTc0Mzk0OHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      caption: 'Workshop Collaboration'
    },
    {
      id: 8,
      image: 'https://images.unsplash.com/photo-1758873268783-967d13f0c163?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdGFydHVwJTIwc3VjY2VzcyUyMGNlbGVicmF0aW9ufGVufDF8fHx8MTc2MTc0Mzk0OXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      caption: 'Success Celebration'
    },
    {
      id: 9,
      image: 'https://images.unsplash.com/photo-1759446334429-bb1f2d1d9f13?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZWFtJTIwYWNoaWV2ZW1lbnQlMjB0cm9waHl8ZW58MXx8fHwxNzYxNzQzOTQ0fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      caption: 'Team Achievement'
    }
  ];

  const [hoveredMember, setHoveredMember] = useState<number | null>(null);
  const [hoveredAchievement, setHoveredAchievement] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-black px-8 py-12">
      {/* Page Title Section */}
      <div className="mb-20 flex flex-col items-center">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="mb-4 text-center text-white"
          style={{ fontFamily: "'Orbitron', sans-serif" }}
        >
          Meet Our Team
        </motion.h1>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: '200px' }}
          transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
          className="h-1 bg-[#e10600]"
          style={{
            boxShadow: '0 0 10px #e10600, 0 0 20px #e10600'
          }}
        />
      </div>

      {/* Team Profiles Section */}
      <div className="mb-32 flex justify-center gap-16">
        {teamMembers.map((member, index) => (
          <motion.div
            key={member.id}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 + index * 0.2, ease: 'easeOut' }}
            className="flex flex-col items-center"
            onMouseEnter={() => setHoveredMember(member.id)}
            onMouseLeave={() => setHoveredMember(null)}
          >
            {/* Profile Image with Red Glow Ring */}
            <div className="relative mb-6">
              <motion.div
                animate={{
                  scale: hoveredMember === member.id ? 1.1 : 1,
                }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="relative h-[200px] w-[200px] rounded-full p-1"
                style={{
                  background: `linear-gradient(135deg, #e10600 0%, #ff3333 100%)`,
                  boxShadow: hoveredMember === member.id
                    ? '0 0 30px #e10600, 0 0 60px #e10600, 0 0 90px #e10600'
                    : '0 0 15px #e10600, 0 0 30px #e10600'
                }}
              >
                <div className="h-full w-full overflow-hidden rounded-full bg-black">
                  <ImageWithFallback
                    src={member.image}
                    alt={member.name}
                    className="h-full w-full object-cover"
                  />
                </div>
              </motion.div>
            </div>

            {/* Member Info */}
            <motion.h3
              className="mb-2 text-center text-white"
              animate={{
                textShadow: hoveredMember === member.id
                  ? '0 0 10px #e10600'
                  : '0 0 0px transparent'
              }}
              transition={{ duration: 0.3 }}
            >
              {member.name}
            </motion.h3>
            <p className="max-w-[250px] text-center text-[#cfcfcf]">
              {member.role}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Gallery Section */}
      <div className="flex flex-col items-center">
        {/* Section Title */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-12 flex flex-col items-center"
        >
          <h2
            className="mb-4 text-center text-white"
            style={{ fontFamily: "'Orbitron', sans-serif" }}
          >
            Our Achievements
          </h2>
          <motion.div
            initial={{ width: 0 }}
            whileInView={{ width: '150px' }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mb-4 h-1 bg-[#e10600]"
            style={{
              boxShadow: '0 0 10px #e10600, 0 0 20px #e10600'
            }}
          />
          <p className="text-center text-[#cfcfcf]">
            Proud moments and milestones of our journey.
          </p>
        </motion.div>

        {/* Gallery Grid */}
        <div className="mx-auto grid max-w-7xl grid-cols-3 gap-8">
          {achievements.map((achievement, index) => (
            <motion.div
              key={achievement.id}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              onMouseEnter={() => setHoveredAchievement(achievement.id)}
              onMouseLeave={() => setHoveredAchievement(null)}
              className="group relative overflow-hidden rounded-2xl border-2 border-[#e10600] bg-black/50"
              style={{
                boxShadow: hoveredAchievement === achievement.id
                  ? '0 0 20px #e10600, 0 0 40px #e10600'
                  : '0 0 10px rgba(225, 6, 0, 0.3)'
              }}
            >
              {/* Image Container */}
              <div className="relative aspect-square overflow-hidden">
                <motion.div
                  animate={{
                    scale: hoveredAchievement === achievement.id ? 1.15 : 1
                  }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  className="h-full w-full"
                >
                  <ImageWithFallback
                    src={achievement.image}
                    alt={achievement.caption}
                    className="h-full w-full object-cover"
                  />
                </motion.div>

                {/* Dark Overlay on Hover */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{
                    opacity: hoveredAchievement === achievement.id ? 0.7 : 0
                  }}
                  transition={{ duration: 0.3 }}
                  className="absolute inset-0 bg-black"
                />
              </div>

              {/* Caption */}
              <div className="p-4">
                <p className="text-center text-white">
                  {achievement.caption}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Bottom Spacing */}
      <div className="h-20" />
    </div>
  );
};

export default TeamMembersPage;
