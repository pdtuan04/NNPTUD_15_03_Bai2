let userModel = require("../schemas/users");
let bcrypt = require('bcrypt')
let jwt = require('jsonwebtoken')
let fs = require('fs')

const PRIVATE_KEY = fs.readFileSync(process.env.JWT_PRIVATE_KEY_PATH, 'utf8');

module.exports = {
    CreateAnUser: async function (username, password, email, role, fullName, avatarUrl, status, loginCount) {
        let newItem = new userModel({
            username: username,
            password: password,
            email: email,
            fullName: fullName,
            avatarUrl: avatarUrl,
            status: status,
            role: role,
            loginCount: loginCount
        });
        await newItem.save();
        return newItem;
    },
    GetAllUser: async function () {
        return await userModel.find({ isDeleted: false })
    },
    GetUserById: async function (id) {
        try {
            return await userModel.find({
                isDeleted: false,
                _id: id
            })
        } catch (error) {
            return false;
        }
    },
    QueryLogin: async function (username, password) {
        if (!username || !password) {
            return false;
        }
        let user = await userModel.findOne({
            username: username,
            isDeleted: false
        })
        if (user) {
            if (bcrypt.compareSync(password, user.password)) {
                return jwt.sign(
                    { id: user.id },
                    PRIVATE_KEY,
                    {
                        algorithm: 'RS256',
                        expiresIn: '1d'
                    }
                )
            } else {
                return false;
            }
        } else {
            return false;
        }
    },
    ChangePassword: async function (userId, oldpassword, newpassword) {
        let user = await userModel.findOne({
            _id: userId,
            isDeleted: false
        });

        if (!user) {
            return { code: 404, message: "khong tim thay user" };
        }

        let ok = bcrypt.compareSync(oldpassword, user.password);
        if (!ok) {
            return { code: 400, message: "oldpassword khong dung" };
        }

        if (oldpassword === newpassword) {
            return { code: 400, message: "newpassword phai khac oldpassword" };
        }

        user.password = newpassword;
        await user.save();
        return { code: 200, message: "doi mat khau thanh cong" };
    }
}