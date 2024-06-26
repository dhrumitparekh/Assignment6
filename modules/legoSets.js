require('dotenv').config();
const Sequelize = require('sequelize');

let sequelize = new Sequelize(process.env.DB_DATABASE, process.env.DB_USER, process.env.DB_PASSWORD, {
  host: process.env.DB_HOST,
  dialect: 'postgres',
  port: 5432,
  dialectOptions: {
    ssl: { rejectUnauthorized: false },
  },
});

sequelize
  .authenticate()
  .then(() => {
    console.log('Connection has been established successfully');
  })
  .catch((err) => {
    console.log('Unable to connect to the database:', err);
  });

const Theme = sequelize.define('Theme', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: Sequelize.STRING,
}, {
  timestamps: false,
});

const Set = sequelize.define('Set', {
  set_num: {
    type: Sequelize.STRING,
    primaryKey: true,
  },
  name: Sequelize.STRING,
  year: Sequelize.INTEGER,
  num_parts: Sequelize.INTEGER,
  theme_id: Sequelize.INTEGER,
  img_url: Sequelize.STRING,
}, {
  timestamps: false,
});

Set.belongsTo(Theme, { foreignKey: 'theme_id' });

function initialize() {
  return sequelize.sync();
}

async function getAllSets() {
  try {
    const sets = await Set.findAll({ include: [Theme] });
    return sets;
  } catch (error) {
    console.error("Error getting all sets:", error);
    throw error;
  }
}

async function getSetByNum(setNum) {
  try {
    const set = await Set.findOne({
      where: { set_num: setNum },
      include: [Theme],
    });
    if (set) {
      return set;
    } else {
      throw `Set not found with set_num: ${setNum}`;
    }
  } catch (error) {
    console.error("Error getting set by set_num:", error);
    throw error;
  }
}

async function getSetsByTheme(theme) {
  try {
    const sets = await Set.findAll({
      include: [Theme],
      where: {
        '$Theme.name$': {
          [Sequelize.Op.iLike]: `%${theme}%`,
        },
      },
    });

    if (sets.length > 0) {
      return sets;
    } else {
      throw `No sets found for theme: ${theme}`;
    }
  } catch (error) {
    console.error("Error getting sets by theme:", error);
    throw error;
  }
}

const addSet = async (setData) => {
  try {
    await Set.create(setData);
  } catch (err) {
    throw err.errors[0].message;
  }
};

const getAllThemes = async () => {
  try {
    const themes = await Theme.findAll();
    return themes;
  } catch (err) {
    throw err;
  }
};

const editSet = async (setNum, setData) => {
  try {
    await Set.update(setData, { where: { set_num: setNum } });
  } catch (err) {
    throw err.errors[0].message;
  }
};

const deleteSet = async (setNum) => {
  try {
    await Set.destroy({ where: { set_num: setNum } });
  } catch (err) {
    throw err.errors[0].message;
  }
};

module.exports = { initialize, getAllSets, getSetByNum, getSetsByTheme, addSet, getAllThemes, editSet, deleteSet };
